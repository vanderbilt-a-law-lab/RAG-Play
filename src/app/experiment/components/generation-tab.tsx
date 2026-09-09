"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmbeddingStore } from "@/app/stores/experiment/embedding-store";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";
import {
  MAX_TOP_K,
  useGenerationStore,
} from "@/app/stores/experiment/generation-store";
import {
  SYSTEM_PROMPT_TEMPLATE,
  USER_PROMPT_TEMPLATE,
  extractCitedNumbers,
  type ContextPassage,
} from "@/app/experiment/constants/prompt-templates";
import {
  EFFORT_DESCRIPTIONS,
  EFFORT_LEVELS,
  type EffortLevel,
} from "@/app/experiment/types/generation";
import { useGeneration } from "@/app/hooks/useGeneration";
import type { BlockSource } from "@/app/experiment/types/text-splitting";
import AppConfigPublic from "@/app/experiment/constants/generation-ui";
import { MessageDisplay } from "./message-display";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  HelpCircle,
  KeyRound,
  ListChecks,
  Loader2,
} from "lucide-react";

/** Viewport-aware height so prompt preview and model response need less inner scrolling. */
const GENERATION_SPLIT_HEIGHT_CLASS =
  "h-[max(38rem,min(56rem,calc(100vh-12.5rem)))]";

const ACCESS_CODE_STORAGE_KEY = "legal-rag-playground.access-code";

/** Only caution and negative flags are worth the model's attention. */
const citatorLabelFor = (source: BlockSource | undefined): string | null =>
  source?.citator && (source.citator.status === "negative" || source.citator.status === "caution")
    ? source.citator.label
    : null;

const readStoredAccessCode = (): string => {
  try {
    return window.localStorage.getItem(ACCESS_CODE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const storeAccessCode = (code: string): void => {
  try {
    window.localStorage.setItem(ACCESS_CODE_STORAGE_KEY, code);
  } catch {
    // Storage may be unavailable (private mode); the code still works for this session.
  }
};

type StepState = "todo" | "done" | "active" | "error";

interface PipelineStep {
  label: string;
  state: StepState;
  detail?: string;
}

const StepIcon = ({ state }: { state: StepState }) => {
  if (state === "done") {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" aria-hidden />;
  }
  if (state === "active") {
    return (
      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" aria-hidden />
    );
  }
  if (state === "error") {
    return <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" aria-hidden />;
  }
  return <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />;
};

export function GenerationTab() {
  const { blocks, strategy } = useTextSplittingStore();
  const { similarities, question } = useEmbeddingStore();
  const {
    effort,
    maxTokens,
    topK,
    presetUserMessage,
    setEffort,
    setMaxTokens,
    setTopK,
  } = useGenerationStore();
  const generation = useGeneration();

  const [accessCode, setAccessCode] = useState("");
  useEffect(() => {
    setAccessCode(readStoredAccessCode());
  }, []);

  // Retrieved passages, numbered for citation. For parent-child, the parent
  // section of each matched child is used (deduplicated, in rank order).
  const passages = useMemo<ContextPassage[]>(() => {
    const top = similarities.slice(0, topK);
    if (strategy === "parent-child") {
      const byParent = new Map<number, ContextPassage>();
      top.forEach(({ index }) => {
        const block = blocks[index];
        if (block?.parentId !== undefined && block.parentText) {
          if (!byParent.has(block.parentId)) {
            byParent.set(block.parentId, {
              number: byParent.size + 1,
              sourceTitle: block.source?.title ?? null,
              citatorLabel: citatorLabelFor(block.source),
              text: block.parentText,
            });
          }
        }
      });
      return Array.from(byParent.values());
    }
    return top
      .map(({ index }) => blocks[index])
      .filter((block): block is NonNullable<typeof block> => Boolean(block?.text))
      .map((block, i) => ({
        number: i + 1,
        sourceTitle: block.source?.title ?? null,
        citatorLabel: citatorLabelFor(block.source),
        text: block.text,
      }));
  }, [blocks, similarities, strategy, topK]);

  const [systemMessage, setSystemMessage] = useState(
    SYSTEM_PROMPT_TEMPLATE(passages)
  );
  const [userMessage, setUserMessage] = useState(
    USER_PROMPT_TEMPLATE(question || "")
  );

  useEffect(() => {
    setSystemMessage(SYSTEM_PROMPT_TEMPLATE(passages));
  }, [passages]);

  useEffect(() => {
    setUserMessage(presetUserMessage ?? USER_PROMPT_TEMPLATE(question || ""));
  }, [question, presetUserMessage]);

  // A new question or a new set of passages makes the last answer stale.
  const { reset: resetGeneration } = generation;
  useEffect(() => {
    resetGeneration();
  }, [passages, question, presetUserMessage, resetGeneration]);

  const hasGenerationInput = passages.length > 0 && Boolean(question);
  const isStreaming = generation.status === "streaming";
  const hasAnswer = generation.text.length > 0 || generation.thinking.length > 0;
  const needsAccessCode = generation.errorCode === "code_required";
  const citedNumbers = useMemo(
    () => extractCitedNumbers(generation.text),
    [generation.text]
  );

  const composedAnswer = useMemo(() => {
    if (!generation.thinking) {
      return generation.text;
    }
    const thinkingClosed = generation.text.length > 0 || !isStreaming;
    return thinkingClosed
      ? `<think>${generation.thinking}</think>${generation.text}`
      : `<think>${generation.thinking}`;
  }, [generation.text, generation.thinking, isStreaming]);

  const thirdStep: PipelineStep = (() => {
    if (generation.status === "error") {
      return {
        label: "The request to the model failed",
        state: "error",
        detail: generation.error ?? "Unknown error",
      };
    }
    if (isStreaming) {
      return {
        label: generation.text
          ? "Streaming the response"
          : generation.thinking
            ? "Model is thinking"
            : "Waiting for the model",
        state: "active",
      };
    }
    if (generation.status === "done") {
      const parts: string[] = [];
      if (generation.model) parts.push(generation.model);
      if (generation.usage) {
        parts.push(
          `${generation.usage.inputTokens} in / ${generation.usage.outputTokens} out tokens`
        );
      }
      if (generation.stopReason === "max_tokens") {
        parts.push("cut off at the max-tokens limit");
      } else if (generation.stopReason === "refusal") {
        parts.push("the model declined to answer");
      }
      return {
        label: "The model wrote an answer from those passages",
        state: "done",
        detail: parts.join(" · "),
      };
    }
    return { label: "Ready to send it to the model", state: "todo" };
  })();

  const steps: PipelineStep[] = [
    {
      label: `Took the top ${passages.length} passage${passages.length === 1 ? "" : "s"} from the Semantic Search tab`,
      state: hasGenerationInput ? "done" : "todo",
    },
    {
      label: "Combined the hidden instructions, the passages, and your question",
      state: hasGenerationInput ? "done" : "todo",
    },
    thirdStep,
  ];

  const handleGenerate = async (): Promise<void> => {
    if (!hasGenerationInput) return;
    await generation.generate(
      {
        system: systemMessage,
        user: userMessage,
        effort,
        maxTokens,
      },
      accessCode || undefined
    );
  };

  const handleAccessCodeChange = (value: string): void => {
    setAccessCode(value);
    storeAccessCode(value);
  };

  const isDisabled = !hasGenerationInput || isStreaming;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Context Generation</CardTitle>
            <CardDescription>
              The retrieved passages, a hidden set of instructions, and your
              question go to the model together. It writes only from what it
              was handed.
              {strategy === "parent-child" && passages.length > 0 && (
                <span className="mt-2 block rounded bg-purple-50 px-2 py-1 text-xs text-purple-700">
                  Parent-child: the model receives the full parent section of
                  each matched chunk.
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <Button variant="outline" onClick={generation.cancel} aria-label="Stop generating">
                Stop
              </Button>
            )}
            <Button
              size="default"
              disabled={isDisabled}
              onClick={handleGenerate}
              className="min-w-[160px]"
              aria-label={
                isDisabled ? "Cannot generate response yet" : "Generate response"
              }
            >
              {isStreaming ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Generating...
                </span>
              ) : (
                "Generate Response"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              Effort:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger aria-label="What effort controls">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      How much the model thinks before it answers. One model,
                      one setting: low is fast and cheap; max spends the most
                      thinking tokens and can overthink a simple question.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <Select
              value={effort}
              onValueChange={(value) => setEffort(value as EffortLevel)}
            >
              <SelectTrigger className="w-[120px]" aria-label="Effort level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EFFORT_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hidden max-w-[260px] text-xs text-muted-foreground lg:inline">
              {EFFORT_DESCRIPTIONS[effort]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              Passages sent:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger aria-label="What passages sent controls">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      How many of the top-ranked chunks from Semantic Search
                      are placed in the prompt. More passages means more
                      context and more noise.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <Input
              type="number"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              min="1"
              max={MAX_TOP_K}
              className="w-20"
              aria-label="Number of passages sent to the model"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              Max tokens:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger aria-label="What max tokens controls">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Ceiling on what the model may generate, thinking
                      included. If it is reached, the answer stops
                      mid-sentence.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => {
                const value = Number(e.target.value);
                setMaxTokens(
                  Math.min(
                    Math.max(1, Number.isFinite(value) ? value : 1),
                    AppConfigPublic.maxOutputTokens
                  )
                );
              }}
              min="1"
              max={AppConfigPublic.maxOutputTokens}
              className="w-24"
              aria-label="Maximum output tokens"
            />
          </div>
        </div>

        {needsAccessCode && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center">
            <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">
              This playground needs a class code before it will call the
              model. Enter the code from your instructor and click Generate
              again.
            </span>
            <Input
              type="text"
              value={accessCode}
              onChange={(e) => handleAccessCodeChange(e.target.value)}
              placeholder="Class code"
              className="w-full bg-white sm:w-48"
              aria-label="Class code"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="space-y-2" aria-label="Prompt Preview Section">
            <label className="text-sm font-medium">What the model receives:</label>
            <div
              className={cn(
                GENERATION_SPLIT_HEIGHT_CLASS,
                "rounded-lg border-2 border-dashed border-muted-foreground/25"
              )}
            >
              <ScrollArea className="h-full p-4">
                {hasGenerationInput ? (
                  <div className="space-y-4">
                    <MessageDisplay
                      message={systemMessage}
                      showOriginal
                      className="bg-muted"
                      isEditable
                      onEdit={setSystemMessage}
                      label="Hidden instructions (the system message)"
                    />
                    <MessageDisplay
                      message={userMessage}
                      showOriginal
                      className="bg-muted"
                      isEditable
                      onEdit={setUserMessage}
                      label="Your question (the user message)"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Type a question in the Semantic Search tab first
                  </div>
                )}
              </ScrollArea>
            </div>
          </section>

          <section className="space-y-2" aria-label="Generated Answer Section">
            <label className="text-sm font-medium">What the model wrote:</label>
            <div
              className={cn(GENERATION_SPLIT_HEIGHT_CLASS, "flex flex-col gap-4")}
            >
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>What happens when you click Generate</span>
                </div>
                {hasGenerationInput ? (
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.label} className="flex items-start gap-2 text-sm">
                        <StepIcon state={step.state} />
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              step.state === "todo" && "text-muted-foreground",
                              step.state === "active" && "font-medium",
                              step.state === "error" && "font-medium text-red-700"
                            )}
                          >
                            {step.label}
                          </span>
                          {step.detail && (
                            <p
                              className={cn(
                                "mt-0.5 break-words text-xs",
                                step.state === "error"
                                  ? "text-red-700"
                                  : "text-muted-foreground"
                              )}
                              role={step.state === "error" ? "alert" : undefined}
                            >
                              {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {generation.status === "done" && passages.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                          Passages cited in the answer
                        </p>
                        <ul className="flex flex-wrap gap-1.5">
                          {passages.map((passage) => {
                            const cited = citedNumbers.has(passage.number);
                            return (
                              <li
                                key={passage.number}
                                className={cn(
                                  "rounded border px-2 py-0.5 text-xs",
                                  cited
                                    ? "border-green-300 bg-green-50 text-green-800"
                                    : "border-border bg-muted/50 text-muted-foreground line-through"
                                )}
                                title={passage.sourceTitle ?? undefined}
                              >
                                [{passage.number}]{" "}
                                {passage.sourceTitle ?? "Untitled passage"}
                              </li>
                            );
                          })}
                        </ul>
                        {citedNumbers.size === 0 && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            The answer cites none of the passages.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-muted-foreground">
                    Type a question in the Semantic Search tab first
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1 rounded-lg border-2 border-dashed border-muted-foreground/25">
                <ScrollArea className="h-full p-4">
                  {hasAnswer ? (
                    <MessageDisplay
                      message={composedAnswer}
                      isStreaming={isStreaming}
                    />
                  ) : generation.status === "error" ? (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-700">
                      {generation.error}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {isStreaming
                        ? "Waiting for the first tokens..."
                        : 'Click "Generate Response" to see what the model writes'}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
