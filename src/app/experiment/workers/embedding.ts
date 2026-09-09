import {
  pipeline,
  Tensor,
  FeatureExtractionPipeline,
  ProgressInfo,
  AutoTokenizer,
  AutoModelForSequenceClassification,
  PreTrainedTokenizer,
  PreTrainedModel,
} from "@huggingface/transformers";
import {
  EmbeddingProgressMessage,
  EmbeddingTaskMessage,
  getEmbeddingModelOption,
} from "../types/embedding";

// One pipeline per model id, created lazily and kept for the worker's life.
const pipelines = new Map<string, Promise<FeatureExtractionPipeline>>();

const getPipeline = (
  model: string,
  report: (message: EmbeddingProgressMessage) => void
): Promise<FeatureExtractionPipeline> => {
  const existing = pipelines.get(model);
  if (existing) {
    return existing;
  }
  report({ status: "loading", message: "Model loading started" });
  const created = (
    pipeline("feature-extraction", model, {
      progress_callback: (progress: ProgressInfo) => {
        if (progress.status === "progress") {
          report({
            status: "loading",
            progress,
            message: "Model loading in progress",
          });
        }
      },
    }) as Promise<FeatureExtractionPipeline>
  ).then((instance) => {
    report({ status: "ready", message: "Model ready" });
    return instance;
  });
  pipelines.set(model, created);
  return created;
};

async function embedMany(
  task: FeatureExtractionPipeline,
  texts: string[],
  pooling: "cls" | "mean"
): Promise<Tensor[]> {
  const output: Tensor[] = [];
  for (let i = 0; i < texts.length; i++) {
    output.push(await task(texts[i], { normalize: true, pooling }));
    self.postMessage({
      status: "embedding",
      progress: {
        name: "text-blocks",
        status: "loading",
        progress: Math.round(((i + 1) / texts.length) * 100),
      },
      message: `Processing block ${i + 1}/${texts.length}`,
    } as EmbeddingProgressMessage);
  }
  return output;
}

// The reranker is a cross-encoder: it reads the question and a passage
// together and outputs one relevance score. Loaded on first use.
let reranker: Promise<{
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
}> | null = null;

const getReranker = (
  modelId: string,
  report: (message: EmbeddingProgressMessage) => void
) => {
  if (!reranker) {
    const progress_callback = (progress: ProgressInfo) => {
      if (progress.status === "progress") {
        report({ status: "loading", progress, message: "Reranker loading" });
      }
    };
    reranker = Promise.all([
      AutoTokenizer.from_pretrained(modelId, { progress_callback }),
      AutoModelForSequenceClassification.from_pretrained(modelId, {
        dtype: "q8",
        progress_callback,
      }),
    ]).then(([tokenizer, model]) => ({ tokenizer, model }));
  }
  return reranker;
};

const rerank = async (
  modelId: string,
  query: string,
  texts: string[],
  report: (message: EmbeddingProgressMessage) => void
): Promise<number[]> => {
  const { tokenizer, model } = await getReranker(modelId, report);
  const inputs = tokenizer(new Array(texts.length).fill(query), {
    text_pair: texts,
    padding: true,
    truncation: true,
  });
  const { logits } = (await model(inputs)) as { logits: Tensor };
  return (logits.sigmoid().tolist() as number[][]).map((row) => row[0]);
};

self.addEventListener(
  "message",
  async (event: MessageEvent<EmbeddingTaskMessage>) => {
    const { requestId } = event.data;
    try {
      if (event.data.task === "rerank") {
        const scores = await rerank(
          event.data.model,
          event.data.query,
          event.data.texts,
          (m) => self.postMessage(m)
        );
        self.postMessage({
          status: "complete",
          type: "rerank",
          requestId,
          scores,
        } as EmbeddingProgressMessage);
        return;
      }

      const { model, type, text } = event.data;
      const option = getEmbeddingModelOption(model);
      const task = await getPipeline(model, (m) => self.postMessage(m));

      const texts = Array.isArray(text) ? text : [text];
      if (texts.length === 0) {
        self.postMessage({
          status: "complete",
          type,
          requestId,
          output: [],
        } as EmbeddingProgressMessage);
        return;
      }

      // Questions get the model's search prefix; passages are embedded as-is.
      const prepared =
        type === "question" ? texts.map((t) => option.queryPrefix + t) : texts;
      const output = await embedMany(task, prepared, option.pooling);

      self.postMessage({
        status: "complete",
        type,
        requestId,
        output: output.map((o) => o.tolist()),
      } as EmbeddingProgressMessage);
    } catch (error) {
      console.error("Worker error:", error);
      self.postMessage({
        status: "error",
        type: event.data.type,
        requestId,
        message: error instanceof Error ? error.message : String(error),
      } as EmbeddingProgressMessage);
    }
  }
);
