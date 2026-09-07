export const EMBEDDING_MODELS = [
  "Snowflake/snowflake-arctic-embed-xs"
] as const;

export type EmbeddingModel = (typeof EMBEDDING_MODELS)[number];

export type LangchainProgress = {
  model?: string;
  file?: string;
  name: string;
  status: "initiate" | "loading" | "done" | "ready" | "progress";
  loaded?: number;
  progress?: number;
  total?: number;
}

export type EmbeddingProgressMessage = {
  status: "loading" | "embedding" | "ready" | "error" | "complete";
  progress?: LangchainProgress;
  message?: string;
  output?: number[][][];
  type?: "question" | "blocks";
  /** Echo of the request id so stale results can be ignored. 0 = model load only. */
  requestId?: number;
};

export type EmbeddingTaskMessage = {
  task: "feature-extraction";
  model: EmbeddingModel;
  type: "question" | "blocks";
  text: string | string[];
  /** Caller-assigned id, echoed back on completion. 0 = model load only. */
  requestId: number;
};

export type UILoadingState = {
  status: "initiate" | "loading-model" | "error" | "loading-model-complete" | "embedding" | "idle";
  progress?: LangchainProgress;
  error?: string;
};

export type UIFileProgress = {
  filename: string;
  progress: number;
  status: 'initiate' | 'loading' | 'done';
};