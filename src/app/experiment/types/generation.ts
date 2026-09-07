export const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;

export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export const EFFORT_DESCRIPTIONS: Record<EffortLevel, string> = {
  low: "Little or no thinking. Fast and cheap. Fine for a direct question about the retrieved passages.",
  medium: "Some thinking before answering.",
  high: "The model's default. More thinking, slower, more tokens.",
  xhigh: "Extended thinking for hard, multi-step questions.",
  max: "Maximum thinking. Slowest and most expensive; can overthink simple questions.",
};

export interface GenerationRequest {
  /** System prompt: instructions plus the retrieved passages. */
  system: string;
  /** The user's question. */
  user: string;
  effort: EffortLevel;
  maxTokens: number;
}

export interface GenerationUsage {
  inputTokens: number;
  outputTokens: number;
}

/** One line of the newline-delimited JSON stream returned by /api/generate. */
export type GenerationEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | {
      type: "done";
      stopReason: string | null;
      model: string;
      usage: GenerationUsage;
    }
  | { type: "error"; code: string; message: string };
