import { create } from "zustand";
import { cos_sim } from "@huggingface/transformers";
import { EmbeddingModel } from "@/app/experiment/types/embedding";
import { DEFAULT_QUESTION, DEFAULT_MODEL } from "@/app/experiment/constants/embedding";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";
import { buildBm25, reciprocalRankFusion } from "@/lib/bm25";

/** How many top-ranked chunks the reranker rescores. */
export const RERANK_TOP_N = 10;

export interface RankedChunk {
  index: number;
  /** Cosine similarity between the question and the chunk. */
  similarity: number;
  /** 1-based rank by cosine similarity alone. */
  vectorRank: number;
  keywordScore?: number;
  /** 1-based rank by keyword (BM25) score; undefined when no query term matched. */
  keywordRank?: number;
  fusedScore?: number;
  rerankScore?: number;
  /** 1-based position before the reranker moved it. */
  rankBeforeRerank?: number;
}

export interface RetrievalSettings {
  /** Fuse keyword (BM25) and vector rankings with reciprocal rank fusion. */
  hybrid: boolean;
  /** Rescore the top chunks with a cross-encoder. */
  rerank: boolean;
  /** Source indexes (1-based, from the corpus headers) to leave out. */
  excludedSources: number[];
  /** Drop chunks whose source carries a negative citator flag. */
  hideFlagged: boolean;
}

export const DEFAULT_RETRIEVAL_SETTINGS: RetrievalSettings = {
  hybrid: false,
  rerank: false,
  excludedSources: [],
  hideFlagged: false,
};

export type RerankStatus = "idle" | "pending" | "done" | "error";

interface EmbeddingState {
  /** Final ranking shown to the user and used for generation. */
  similarities: RankedChunk[];
  /** Ranking before the reranker (filters and fusion applied). */
  baseRanking: RankedChunk[];
  rerankStatus: RerankStatus;
  retrieval: RetrievalSettings;
  questionEmbedding: number[][];
  blocksEmbedding: number[][][];
  question: string;
  model: EmbeddingModel;
  worker: Worker | null;
  setQuestionEmbedding: (questionEmbedding: number[][]) => void;
  setBlocksEmbedding: (blocksEmbedding: number[][][]) => void;
  setQuestion: (question: string) => void;
  setModel: (model: EmbeddingModel) => void;
  setWorker: (worker: Worker | null) => void;
  setRetrieval: (patch: Partial<RetrievalSettings>) => void;
  resetRetrieval: (overrides?: Partial<RetrievalSettings>) => void;
  clearSemanticSearch: () => void;
  recalculateSimilarities: () => void;
  applyRerank: (scores: { index: number; score: number }[]) => void;
  markRerankFailed: () => void;
}

const rankChunks = (
  question: string,
  questionEmbedding: number[][],
  blocksEmbedding: number[][][],
  settings: RetrievalSettings
): RankedChunk[] => {
  if (questionEmbedding.length === 0 || blocksEmbedding.length === 0) {
    return [];
  }
  const blocks = useTextSplittingStore.getState().blocks;
  const count = Math.min(blocksEmbedding.length, blocks.length);
  const excluded = new Set(settings.excludedSources);

  const candidates: number[] = [];
  for (let i = 0; i < count; i++) {
    const source = blocks[i]?.source;
    if (source && excluded.has(source.index)) continue;
    if (settings.hideFlagged && source?.citator?.status === "negative") continue;
    candidates.push(i);
  }
  if (candidates.length === 0) {
    return [];
  }

  const byVector = candidates
    .map((index) => ({
      index,
      similarity: cos_sim(questionEmbedding[0], blocksEmbedding[index][0]),
    }))
    .sort((a, b) => b.similarity - a.similarity);
  const vectorRank = new Map<number, number>();
  byVector.forEach((item, i) => vectorRank.set(item.index, i + 1));

  if (!settings.hybrid) {
    return byVector.map((item) => ({
      index: item.index,
      similarity: item.similarity,
      vectorRank: vectorRank.get(item.index)!,
    }));
  }

  const bm25 = buildBm25(candidates.map((index) => blocks[index].text));
  const keywordScores = bm25.score(question);
  const byKeyword = candidates
    .map((index, position) => ({ index, score: keywordScores[position] }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const keywordRank = new Map<number, number>();
  const keywordScore = new Map<number, number>();
  byKeyword.forEach((item, i) => {
    keywordRank.set(item.index, i + 1);
    keywordScore.set(item.index, item.score);
  });

  const fused = reciprocalRankFusion([
    byVector.map((item) => item.index),
    byKeyword.map((item) => item.index),
  ]);
  const similarityOf = new Map(byVector.map((item) => [item.index, item.similarity]));

  return candidates
    .map((index) => ({
      index,
      similarity: similarityOf.get(index) ?? 0,
      vectorRank: vectorRank.get(index)!,
      keywordScore: keywordScore.get(index),
      keywordRank: keywordRank.get(index),
      fusedScore: fused.get(index) ?? 0,
    }))
    .sort(
      (a, b) =>
        (b.fusedScore ?? 0) - (a.fusedScore ?? 0) || a.vectorRank - b.vectorRank
    );
};

export const useEmbeddingStore = create<EmbeddingState>((set, get) => ({
  similarities: [],
  baseRanking: [],
  rerankStatus: "idle",
  retrieval: DEFAULT_RETRIEVAL_SETTINGS,
  questionEmbedding: [],
  blocksEmbedding: [],
  question: DEFAULT_QUESTION,
  model: DEFAULT_MODEL,
  worker: null,
  setQuestionEmbedding: (questionEmbedding) => set({ questionEmbedding }),
  setBlocksEmbedding: (blocksEmbedding) => set({ blocksEmbedding }),
  setQuestion: (question) => set({ question }),
  setModel: (model) => set({ model }),
  setWorker: (worker) => set({ worker }),
  setRetrieval: (patch) => {
    set({ retrieval: { ...get().retrieval, ...patch } });
    get().recalculateSimilarities();
  },
  resetRetrieval: (overrides) => {
    set({ retrieval: { ...DEFAULT_RETRIEVAL_SETTINGS, ...overrides } });
    get().recalculateSimilarities();
  },
  clearSemanticSearch: () =>
    set({
      questionEmbedding: [],
      similarities: [],
      baseRanking: [],
      rerankStatus: "idle",
    }),
  recalculateSimilarities: () => {
    const { question, questionEmbedding, blocksEmbedding, retrieval } = get();
    const ranking = rankChunks(
      question,
      questionEmbedding,
      blocksEmbedding,
      retrieval
    );
    set({
      baseRanking: ranking,
      similarities: ranking,
      rerankStatus: retrieval.rerank && ranking.length > 0 ? "pending" : "idle",
    });
  },
  applyRerank: (scores) => {
    const { baseRanking } = get();
    const scoreOf = new Map(scores.map((s) => [s.index, s.score]));
    const head = baseRanking
      .slice(0, RERANK_TOP_N)
      .map((item, position) => ({
        ...item,
        rankBeforeRerank: position + 1,
        rerankScore: scoreOf.get(item.index),
      }))
      .sort((a, b) => (b.rerankScore ?? -1) - (a.rerankScore ?? -1));
    const tail = baseRanking.slice(RERANK_TOP_N);
    set({ similarities: [...head, ...tail], rerankStatus: "done" });
  },
  markRerankFailed: () => set({ rerankStatus: "error" }),
}));
