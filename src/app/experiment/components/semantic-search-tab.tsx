"use client";

import { useCallback, useMemo } from "react";
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
import { getEmbeddingModelOption } from "@/app/experiment/types/embedding";
import { groupPointsBySource } from "@/app/experiment/utils/source-groups";
import { EMBEDDING_CONSTANTS } from "@/app/hooks";
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
    model,
    setQuestion,
    clearSemanticSearch,
  } = useEmbeddingStore();
  const { loadingState, debouncedGetEmbedding } = embeddingWorker;
  const modelOption = getEmbeddingModelOption(model);

  const embedding2d = useEmbedding2D({
    questionEmbedding,
    blocksEmbedding,
    question,
  });

  // Point i+1 in the projection is block i; point 0 is the question.
  const chunkPoints = useMemo(
    () =>
      embedding2d.slice(1).map((point, index) => ({
        ...point,
        details: blocks[index]
          ? [
              blocks[index].source?.shortTitle ?? "Source unknown",
              blocks[index].text.replace(/\s+/g, " ").slice(0, 80),
            ]
          : undefined,
      })),
    [embedding2d, blocks]
  );
  const sourceGroups = useMemo(
    () => groupPointsBySource(chunkPoints, blocks),
    [chunkPoints, blocks]
  );

  // What the scores look like across the whole corpus, so a single number
  // can be read against the spread rather than on its own.
  const scoreContext = useMemo(() => {
    if (similarities.length < 3) return null;
    const scores = similarities.map((s) => s.similarity);
    const best = scores[0];
    const median = scores[Math.floor(scores.length / 2)];
    const worst = scores[scores.length - 1];
    const top = similarities
      .slice(0, EMBEDDING_CONSTANTS.SIMILARITY_TOP_N)
      .map(({ index }) => blocks[index]?.source?.shortTitle ?? "Source unknown");
    const bySource = new Map<string, number>();
    top.forEach((title) => bySource.set(title, (bySource.get(title) ?? 0) + 1));
    return {
      best,
      median,
      worst,
      bySource: Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [similarities, blocks]);

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
          Your question is turned into a vector and compared with every
          chunk&apos;s vector. The closest chunks are what the model will be
          given. Nothing here reads the law; it measures similarity of
          wording.
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
                data={chunkPoints}
                groups={sourceGroups}
                query={embedding2d[0]}
                title="Question and chunks, projected to 2-D"
                datasetLabel="Chunks"
                queryLabel="Question"
                className="h-[400px]"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground lg:w-1/2">
              <p>
                The question is embedded with the same model as the chunks
                {modelOption.queryPrefix
                  ? ", with a search prefix the model was trained to expect on questions but not on passages,"
                  : ""}{" "}
                and every chunk is ranked by cosine similarity to it. Dashed
                lines join the question to its five nearest chunks in this
                projection.
              </p>
              <p>
                Points are colored by source document. The projection is
                approximate: two points can look close here and still rank
                far apart in the full vector space.
              </p>
              {scoreContext && (
                <div className="space-y-1 border-t pt-2">
                  <p>
                    <span className="font-medium text-foreground">
                      Reading the scores.
                    </span>{" "}
                    Best chunk {scoreContext.best.toFixed(3)}, median chunk{" "}
                    {scoreContext.median.toFixed(3)}, worst{" "}
                    {scoreContext.worst.toFixed(3)}. A top score close to the
                    median means the best match is barely closer to your
                    question than a random chunk, which is what a question
                    the corpus cannot answer looks like. There is never a
                    &quot;no results&quot; outcome.
                  </p>
                  <p>
                    Top {EMBEDDING_CONSTANTS.SIMILARITY_TOP_N} by source:{" "}
                    {scoreContext.bySource
                      .map(([title, count]) => `${title} ${count}`)
                      .join(" · ")}
                    .
                  </p>
                </div>
              )}
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
