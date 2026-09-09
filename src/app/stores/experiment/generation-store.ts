import { create } from "zustand";
import type { EffortLevel } from "@/app/experiment/types/generation";

interface GenerationSettingsState {
  effort: EffortLevel;
  maxTokens: number;
  /** How many retrieved passages to hand to the model. */
  topK: number;
  /** A scenario can pin the user message to something other than the retrieval question. */
  presetUserMessage: string | null;
  setEffort: (effort: EffortLevel) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTopK: (topK: number) => void;
  setPresetUserMessage: (message: string | null) => void;
}

export const DEFAULT_MAX_TOKENS = 2048;
export const DEFAULT_TOP_K = 3;
export const MAX_TOP_K = 6;

export const useGenerationStore = create<GenerationSettingsState>((set) => ({
  effort: "low",
  maxTokens: DEFAULT_MAX_TOKENS,
  topK: DEFAULT_TOP_K,
  presetUserMessage: null,
  setEffort: (effort) => set({ effort }),
  setMaxTokens: (maxTokens) => set({ maxTokens }),
  setTopK: (topK) => set({ topK: Math.min(Math.max(1, topK), MAX_TOP_K) }),
  setPresetUserMessage: (presetUserMessage) => set({ presetUserMessage }),
}));
