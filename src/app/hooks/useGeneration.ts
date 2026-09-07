"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GenerationEvent,
  GenerationRequest,
  GenerationUsage,
} from "@/app/experiment/types/generation";

export type GenerationStatus = "idle" | "streaming" | "done" | "error";

export interface GenerationState {
  status: GenerationStatus;
  thinking: string;
  text: string;
  error: string | null;
  errorCode: string | null;
  stopReason: string | null;
  model: string | null;
  usage: GenerationUsage | null;
}

export interface UseGenerationReturn extends GenerationState {
  generate: (request: GenerationRequest, accessCode?: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const INITIAL_STATE: GenerationState = {
  status: "idle",
  thinking: "",
  text: "",
  error: null,
  errorCode: null,
  stopReason: null,
  model: null,
  usage: null,
};

const readErrorBody = async (
  response: Response
): Promise<{ code: string; message: string }> => {
  const fallback = {
    code: "http_error",
    message: `The server returned an error (HTTP ${response.status}).`,
  };
  try {
    const parsed = (await response.json()) as {
      error?: unknown;
      message?: unknown;
    };
    return {
      code: typeof parsed.error === "string" ? parsed.error : fallback.code,
      message:
        typeof parsed.message === "string" ? parsed.message : fallback.message,
    };
  } catch {
    return fallback;
  }
};

/**
 * Streams a response from /api/generate and exposes it as React state.
 * Every failure path lands in `status === "error"` with a readable message,
 * so the UI can always tell the user what happened.
 */
export function useGeneration(): UseGenerationReturn {
  const [state, setState] = useState<GenerationState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const applyEvent = useCallback((event: GenerationEvent): void => {
    setState((prev) => {
      switch (event.type) {
        case "thinking":
          return { ...prev, thinking: prev.thinking + event.text };
        case "text":
          return { ...prev, text: prev.text + event.text };
        case "done":
          return {
            ...prev,
            status: "done",
            stopReason: event.stopReason,
            model: event.model,
            usage: event.usage,
          };
        case "error":
          return {
            ...prev,
            status: "error",
            error: event.message,
            errorCode: event.code,
          };
        default:
          return prev;
      }
    });
  }, []);

  const generate = useCallback(
    async (request: GenerationRequest, accessCode?: string): Promise<void> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ ...INITIAL_STATE, status: "streaming" });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessCode ? { "x-access-code": accessCode } : {}),
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok) {
          const { code, message } = await readErrorBody(response);
          setState((prev) => ({
            ...prev,
            status: "error",
            error: message,
            errorCode: code,
          }));
          return;
        }

        if (!response.body) {
          throw new Error("The server returned an empty response.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawTerminalEvent = false;

        const consumeLine = (line: string): void => {
          const trimmed = line.trim();
          if (!trimmed) {
            return;
          }
          const event = JSON.parse(trimmed) as GenerationEvent;
          if (event.type === "done" || event.type === "error") {
            sawTerminalEvent = true;
          }
          applyEvent(event);
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          let newline = buffer.indexOf("\n");
          while (newline >= 0) {
            consumeLine(buffer.slice(0, newline));
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf("\n");
          }
        }
        if (buffer.trim()) {
          consumeLine(buffer);
        }

        if (!sawTerminalEvent) {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "The connection closed before the model finished.",
            errorCode: "stream_closed",
          }));
        }
      } catch (error) {
        if (controller.signal.aborted) {
          setState((prev) => ({ ...prev, status: "idle" }));
          return;
        }
        setState((prev) => ({
          ...prev,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "The request failed before the model responded.",
          errorCode: "network",
        }));
      }
    },
    [applyEvent]
  );

  const cancel = useCallback((): void => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback((): void => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { ...state, generate, cancel, reset };
}
