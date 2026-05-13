"use client";

import { useCallback } from "react";
import LowVectorVisualization from "@/app/experiment/components/low-vector-visualization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEmbedding2D } from "@/app/hooks/useEmbedding2D";
import type { UseEmbeddingWorkerReturn } from "@/app/hooks/useEmbeddingWorker";
import { useEmbeddingStore } from "@/app/stores/experiment/embedding-store";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";
import { EmbeddingDisplay } from "./embedding/EmbeddingDisplay";
import { SimilarityPanel } from "./embedding/SimilarityPanel";

interface SemanticSearchTabProps {
  embeddingWorker: UseEmbeddingWorkerReturn;
}

export function SemanticSearchTab({
  embeddingWorker,
}: SemanticSearchTabProps) {
  const { blocks } = useTextSplittingStore();
  const {
    similarities,
    question,
    questionEmbedding,
    blocksEmbedding,
    setQuestion,
    clearSemanticSearch,
  } = useEmbeddingStore();
  const { loadingState, debouncedGetEmbedding } = embeddingWorker;

  const embedding2d = useEmbedding2D({
    questionEmbedding,
    blocksEmbedding,
    question,
  });

  const handleQuestionChange = useCallback(
    (newQuestion: string) => {
      setQuestion(newQuestion);
      if (!newQuestion.trim()) {
        clearSemanticSearch();
        return;
      }

      debouncedGetEmbedding(newQuestion);
    },
    [clearSemanticSearch, debouncedGetEmbedding, setQuestion]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semantic Search</CardTitle>
        <CardDescription>
          Embed a user query, compare it against the knowledge-base vectors, and
          inspect the chunks selected for retrieval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmbeddingDisplay
          question={question}
          questionEmbedding={questionEmbedding}
          onQuestionChange={handleQuestionChange}
        />

        {embedding2d.length > 0 && (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="lg:w-1/2">
              <LowVectorVisualization
                data={embedding2d.slice(1)}
                query={embedding2d[0]}
                title="Query Similarity"
                datasetLabel="Chunks"
                queryLabel="Question"
                className="h-[400px]"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground lg:w-1/2">
              <p>
                The query is embedded with the same model as the knowledge-base
                chunks, then ranked by vector similarity.
              </p>
              <p>
                This separates indexing from retrieval: chunk embeddings are
                prepared first, while query embedding and similarity scoring
                happen when a question is asked.
              </p>
            </div>
          </div>
        )}

        <SimilarityPanel
          similarities={similarities}
          blocks={blocks}
          isLoading={loadingState.status === "embedding"}
        />
      </CardContent>
    </Card>
  );
}
