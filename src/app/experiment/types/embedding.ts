export interface EmbeddingModelOption {
  id: string;
  label: string;
  /** How token vectors are pooled into one vector. Must match the model card. */
  pooling: "cls" | "mean";
  /**
   * Text prepended to the question (never to passages). Retrieval models such
   * as Snowflake arctic-embed are trained asymmetrically and rank poorly
   * without it.
   */
  queryPrefix: string;
  note: string;
}

export const EMBEDDING_MODEL_OPTIONS = [
  {
    id: "Snowflake/snowflake-arctic-embed-xs",
    label: "Snowflake arctic-embed-xs (default)",
    pooling: "cls",
    queryPrefix: "Represent this sentence for searching relevant passages: ",
    note: "Built for search. Questions get a special prefix; passages do not.",
  },
  {
    id: "Xenova/all-MiniLM-L6-v2",
    label: "all-MiniLM-L6-v2",
    pooling: "mean",
    queryPrefix: "",
    note: "General-purpose sentence model of about the same size. Compare the ranking.",
  },
] as const satisfies readonly EmbeddingModelOption[];

export type EmbeddingModel = (typeof EMBEDDING_MODEL_OPTIONS)[number]["id"];

export const EMBEDDING_MODELS = EMBEDDING_MODEL_OPTIONS.map(
  (option) => option.id
) as EmbeddingModel[];

export const getEmbeddingModelOption = (
  id: string
): EmbeddingModelOption =>
  EMBEDDING_MODEL_OPTIONS.find((option) => option.id === id) ??
  EMBEDDING_MODEL_OPTIONS[0];

export type LangchainProgress = {
  model?: string;
  file?: string;
  name: string;
  status: "initiate" | "loading" | "done" | "ready" | "progress";
  loaded?: number;
  progress?: number;
  total?: number;
}

/** Cross-encoder used by the rerank toggle. Scores (question, passage) pairs directly. */
export const RERANKER_MODEL = "mixedbread-ai/mxbai-rerank-xsmall-v1";

export type EmbeddingProgressMessage = {
  status: "loading" | "embedding" | "ready" | "error" | "complete";
  progress?: LangchainProgress;
  message?: string;
  output?: number[][][];
  /** Rerank results, one score per input passage, in order. */
  scores?: number[];
  type?: "question" | "blocks" | "rerank";
  /** Echo of the request id so stale results can be ignored. 0 = model load only. */
  requestId?: number;
};

export type EmbeddingTaskMessage =
  | {
      task: "feature-extraction";
      model: EmbeddingModel;
      type: "question" | "blocks";
      text: string | string[];
      /** Caller-assigned id, echoed back on completion. 0 = model load only. */
      requestId: number;
    }
  | {
      task: "rerank";
      model: string;
      type: "rerank";
      query: string;
      texts: string[];
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
