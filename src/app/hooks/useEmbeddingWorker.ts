import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  EmbeddingModel,
  EmbeddingProgressMessage,
  EmbeddingTaskMessage,
  UILoadingState,
  UIFileProgress,
} from "@/app/experiment/types/embedding";
import { useEmbeddingStore } from "@/app/stores/experiment/embedding-store";
import { EMBEDDING_CONSTANTS } from "./useEmbeddingConstants";

interface UseEmbeddingWorkerProps {
  blocks: { text: string }[];
  model: EmbeddingModel;
}

export interface UseEmbeddingWorkerReturn {
  loadingState: UILoadingState;
  fileProgresses: Map<string, UIFileProgress>;
  embeddingProgress: number;
  loadingProgress: number;
  isLoadingExpanded: boolean;
  setIsLoadingExpanded: (expanded: boolean) => void;
  /** Embed a question (debounced). Pass nothing to re-embed the current chunks. */
  debouncedGetEmbedding: (question?: string) => void;
}

const LOAD_ONLY_REQUEST_ID = 0;

/**
 * Owns the embedding web worker.
 *
 * One worker per model. Whenever the chunks change, they are re-embedded and
 * the current question is embedded again afterwards, so the similarity
 * ranking always refers to the chunks on screen. Each request carries an id;
 * results from superseded requests are dropped.
 */
export function useEmbeddingWorker({
  blocks,
  model,
}: UseEmbeddingWorkerProps): UseEmbeddingWorkerReturn {
  const { setQuestionEmbedding, setBlocksEmbedding, setWorker } =
    useEmbeddingStore();

  const [loadingState, setLoadingState] = useState<UILoadingState>({
    status: "initiate",
  });
  const [fileProgresses, setFileProgresses] = useState<
    Map<string, UIFileProgress>
  >(new Map());
  const [embeddingProgress, setEmbeddingProgress] = useState<number>(0);
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const modelReadyRef = useRef(false);
  const requestCounterRef = useRef(LOAD_ONLY_REQUEST_ID);
  const latestRequestRef = useRef<{ blocks: number; question: number }>({
    blocks: LOAD_ONLY_REQUEST_ID,
    question: LOAD_ONLY_REQUEST_ID,
  });
  const pendingBlockTextsRef = useRef<string[] | null>(null);

  const postTask = useCallback(
    (type: "question" | "blocks", texts: string[]): void => {
      if (!workerRef.current) {
        return;
      }
      requestCounterRef.current += 1;
      const requestId = requestCounterRef.current;
      latestRequestRef.current[type] = requestId;
      const message: EmbeddingTaskMessage = {
        task: "feature-extraction",
        model,
        type,
        text: texts,
        requestId,
      };
      workerRef.current.postMessage(message);
      setLoadingState({ status: "embedding" });
      setEmbeddingProgress(0);
    },
    [model]
  );

  const embedQuestion = useCallback(
    (question: string): void => {
      if (!question.trim()) {
        return;
      }
      postTask("question", [question]);
    },
    [postTask]
  );

  const embedBlocks = useCallback(
    (texts: string[]): void => {
      if (texts.length === 0) {
        setBlocksEmbedding([]);
        useEmbeddingStore.getState().clearSemanticSearch();
        return;
      }
      if (!modelReadyRef.current) {
        pendingBlockTextsRef.current = texts;
        return;
      }
      postTask("blocks", texts);
    },
    [postTask, setBlocksEmbedding]
  );

  const handleWorkerMessage = useCallback(
    (event: MessageEvent<EmbeddingProgressMessage>): void => {
      const { status, progress, message, output, type, requestId } = event.data;

      if (status === "loading" && progress?.file) {
        setLoadingState({ status: "loading-model", progress });
        const filename = progress.file;
        setFileProgresses((prev) => {
          const next = new Map(prev);
          next.set(filename, {
            filename,
            progress: progress.status === "done" ? 100 : progress.progress || 0,
            status: progress.status === "done" ? "done" : "loading",
          });
          return next;
        });
        return;
      }

      if (status === "ready") {
        modelReadyRef.current = true;
        setLoadingState({ status: "loading-model-complete" });
        const pending = pendingBlockTextsRef.current;
        pendingBlockTextsRef.current = null;
        if (pending && pending.length > 0) {
          postTask("blocks", pending);
        }
        return;
      }

      if (status === "embedding") {
        setLoadingState({ status: "embedding" });
        setEmbeddingProgress(progress?.progress || 0);
        return;
      }

      if (status === "complete") {
        if (requestId === LOAD_ONLY_REQUEST_ID || requestId === undefined) {
          setLoadingState({ status: "idle" });
          return;
        }
        const taskType = type ?? "blocks";
        if (requestId !== latestRequestRef.current[taskType]) {
          return; // superseded by a newer request
        }
        if (taskType === "question") {
          setQuestionEmbedding(output?.[0] ?? []);
        } else {
          setBlocksEmbedding(output ?? []);
          const currentQuestion = useEmbeddingStore.getState().question;
          if (currentQuestion.trim()) {
            postTask("question", [currentQuestion]);
            return;
          }
        }
        setLoadingState({ status: "idle" });
        return;
      }

      if (status === "error") {
        setLoadingState({ status: "error", error: message });
      }
    },
    [postTask, setBlocksEmbedding, setQuestionEmbedding]
  );

  const handlerRef = useRef(handleWorkerMessage);
  useEffect(() => {
    handlerRef.current = handleWorkerMessage;
  }, [handleWorkerMessage]);

  // One worker per model; the message handler is read through a ref so the
  // worker is not recreated when React re-renders.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const worker = new Worker(
      new URL("../experiment/workers/embedding.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (event: MessageEvent<EmbeddingProgressMessage>) => {
      handlerRef.current(event);
    };
    worker.onerror = () => {
      setLoadingState({
        status: "error",
        error: "The embedding worker failed to start.",
      });
    };
    workerRef.current = worker;
    modelReadyRef.current = false;
    setWorker(worker);

    const loadModelMessage: EmbeddingTaskMessage = {
      task: "feature-extraction",
      model,
      text: [],
      type: "blocks",
      requestId: LOAD_ONLY_REQUEST_ID,
    };
    worker.postMessage(loadModelMessage);

    return () => {
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
      setWorker(null);
    };
  }, [model, setWorker]);

  const debouncedEmbedBlocks = useDebouncedCallback((texts: string[]) => {
    embedBlocks(texts);
  }, 200);

  // Re-embed whenever the chunks change.
  useEffect(() => {
    const texts = blocks.map((block) => block.text).filter((t) => t.length > 0);
    debouncedEmbedBlocks(texts);
  }, [blocks, debouncedEmbedBlocks]);

  const debouncedGetEmbedding = useDebouncedCallback(
    (question: string = "") => {
      if (question.length > 0) {
        embedQuestion(question);
        return;
      }
      const texts = blocks
        .map((block) => block.text)
        .filter((t) => t.length > 0);
      embedBlocks(texts);
    },
    EMBEDDING_CONSTANTS.DEBOUNCE_MS
  );

  const loadingProgress = (() => {
    if (fileProgresses.size === 0) return 0;
    let total = 0;
    fileProgresses.forEach((file) => {
      total += file.status === "done" ? 100 : file.progress;
    });
    return Math.round(total / fileProgresses.size);
  })();

  return {
    loadingState,
    fileProgresses,
    embeddingProgress,
    loadingProgress,
    isLoadingExpanded,
    setIsLoadingExpanded,
    debouncedGetEmbedding,
  };
}
