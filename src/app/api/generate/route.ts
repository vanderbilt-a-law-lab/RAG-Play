import Anthropic from "@anthropic-ai/sdk";
import AppConfig from "@/app/config";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import {
  EFFORT_LEVELS,
  type EffortLevel,
  type GenerationEvent,
  type GenerationRequest,
} from "@/app/experiment/types/generation";

export const runtime = "nodejs";
export const maxDuration = 120;

const encoder = new TextEncoder();

const jsonError = (code: string, message: string, status: number): Response =>
  Response.json({ error: code, message }, { status });

const isEffortLevel = (value: unknown): value is EffortLevel =>
  typeof value === "string" &&
  (EFFORT_LEVELS as readonly string[]).includes(value);

const describeError = (error: unknown): { code: string; message: string } => {
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      code: "auth",
      message:
        "The server has no valid Anthropic API key. Set ANTHROPIC_API_KEY in the deployment environment and redeploy.",
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      code: "provider_rate_limit",
      message:
        "The model provider is rate-limiting this app. Wait a few seconds and try again.",
    };
  }
  if (error instanceof Anthropic.NotFoundError) {
    return {
      code: "model_not_found",
      message: `The configured model "${AppConfig.anthropic.model}" was not found. Check ANTHROPIC_MODEL.`,
    };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return {
      code: "bad_request",
      message: `The model provider rejected the request: ${error.message}`,
    };
  }
  if (error instanceof Anthropic.APIError) {
    return {
      code: "provider_error",
      message: `Model provider error (${error.status ?? "unknown"}): ${error.message}`,
    };
  }
  if (error instanceof Error) {
    return { code: "server_error", message: error.message };
  }
  return { code: "server_error", message: "Unknown server error." };
};

export async function POST(req: Request): Promise<Response> {
  if (AppConfig.accessCode) {
    const supplied = req.headers.get("x-access-code") ?? "";
    if (supplied !== AppConfig.accessCode) {
      return jsonError(
        "code_required",
        "This playground needs a class code before it will call the model.",
        401
      );
    }
  }

  const limit = checkRateLimit(getClientKey(req));
  if (!limit.ok) {
    return jsonError(
      "rate_limited",
      `Too many requests from this connection. Try again in ${limit.retryAfterSeconds} seconds.`,
      429
    );
  }

  let body: Partial<GenerationRequest>;
  try {
    body = (await req.json()) as Partial<GenerationRequest>;
  } catch {
    return jsonError("bad_json", "Request body must be JSON.", 400);
  }

  const system = typeof body.system === "string" ? body.system : "";
  const user = typeof body.user === "string" ? body.user.trim() : "";
  if (!user) {
    return jsonError("empty_question", "The user message is empty.", 400);
  }
  if (system.length > AppConfig.anthropic.maxContextChars) {
    return jsonError(
      "context_too_long",
      `The system prompt is ${system.length} characters; the limit is ${AppConfig.anthropic.maxContextChars}. Use fewer or smaller chunks.`,
      400
    );
  }
  if (user.length > AppConfig.anthropic.maxQuestionChars) {
    return jsonError(
      "question_too_long",
      `The user message is ${user.length} characters; the limit is ${AppConfig.anthropic.maxQuestionChars}.`,
      400
    );
  }

  const effort: EffortLevel = isEffortLevel(body.effort) ? body.effort : "low";
  const requestedTokens = Number(body.maxTokens);
  const maxTokens =
    Number.isFinite(requestedTokens) && requestedTokens > 0
      ? Math.min(Math.floor(requestedTokens), AppConfig.anthropic.maxOutputTokens)
      : AppConfig.anthropic.maxOutputTokens;

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: AppConfig.anthropic.model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort },
  });

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: GenerationEvent): void => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        for await (const event of stream) {
          if (event.type !== "content_block_delta") {
            continue;
          }
          if (event.delta.type === "thinking_delta") {
            send({ type: "thinking", text: event.delta.thinking });
          } else if (event.delta.type === "text_delta") {
            send({ type: "text", text: event.delta.text });
          }
        }

        const final = await stream.finalMessage();
        send({
          type: "done",
          stopReason: final.stop_reason,
          model: final.model,
          usage: {
            inputTokens: final.usage.input_tokens,
            outputTokens: final.usage.output_tokens,
          },
        });
      } catch (error) {
        const { code, message } = describeError(error);
        send({ type: "error", code, message });
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
