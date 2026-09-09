"use client";

import LowVectorVisualization from "@/app/experiment/components/low-vector-visualization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";
import { useEmbeddingStore } from "@/app/stores/experiment/embedding-store";
import type { UseEmbeddingWorkerReturn } from "@/app/hooks/useEmbeddingWorker";
import { ModelSelector } from "./embedding/ModelSelector";
import { LoadingPanel } from "./embedding/LoadingPanel";
import { EMBEDDING_CONSTANTS } from "@/app/hooks";
import { embedTo2D } from "@/lib/utils";
import type { EmbeddingModel } from "@/app/experiment/types/embedding";
import { groupPointsBySource } from "@/app/experiment/utils/source-groups";

interface EmbeddingTabProps {
  embeddingWorker: UseEmbeddingWorkerReturn;
}

export function EmbeddingTab({ embeddingWorker }: EmbeddingTabProps) {
  const { blocks, strategy } = useTextSplittingStore();
  const {
    blocksEmbedding,
    model,
    setModel,
  } = useEmbeddingStore();

  const {
    loadingState,
    fileProgresses,
    embeddingProgress,
    loadingProgress,
    isLoadingExpanded,
    setIsLoadingExpanded,
  } = embeddingWorker;

  const embedding2d = useMemo(() => {
    if (blocksEmbedding.length < EMBEDDING_CONSTANTS.MIN_EMBEDDING_POINTS) {
      return [];
    }

    try {
      return embedTo2D(blocksEmbedding.map((embedding) => embedding[0])).map(
        (point, index) => ({
          ...point,
          title: `Chunk ${index + 1}`,
          details: blocks[index]
            ? [
                blocks[index].source?.shortTitle ?? "Source unknown",
                blocks[index].text.replace(/\s+/g, " ").slice(0, 80),
              ]
            : undefined,
        })
      );
    } catch {
      return [];
    }
  }, [blocksEmbedding, blocks]);

  const sourceGroups = useMemo(
    () => groupPointsBySource(embedding2d, blocks),
    [embedding2d, blocks]
  );

  const handleModelChange = (newModel: string) => {
    setModel(newModel as EmbeddingModel);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vector Embedding</CardTitle>
        <CardDescription>
          Each chunk is turned into a list of numbers. Chunks that mean
          similar things get similar numbers. This is the index the search
          runs over; nothing here depends on your question yet.
        </CardDescription>
        <blockquote className="space-y-2 border-l-4 border-muted-foreground/25 px-4 py-2 text-xs text-muted-foreground">
          <p>
            The list of numbers is called an embedding, or a vector. Text with
            similar meaning gets numbers that are close together, so
            &quot;sanction&quot; lands nearer to &quot;penalty&quot; than to
            &quot;sandwich.&quot; The classic example: the numbers for
            &quot;king&quot; minus &quot;man&quot; plus &quot;woman&quot; come
            out close to the numbers for &quot;queen.&quot;
          </p>
          <p>
            The model runs in your browser. Nothing is sent anywhere at this
            step.
          </p>
        </blockquote>
      </CardHeader>
      <CardContent className="space-y-4">
        <ModelSelector model={model} onModelChange={handleModelChange} />

        <LoadingPanel
          loadingState={loadingState}
          loadingProgress={loadingProgress}
          fileProgresses={fileProgresses}
          isLoadingExpanded={isLoadingExpanded}
          onToggleExpanded={() => setIsLoadingExpanded(!isLoadingExpanded)}
        />

        {embedding2d.length > 0 && (
          <div className="flex gap-4">
            <div className="w-1/2">
              <LowVectorVisualization
                data={embedding2d}
                groups={sourceGroups}
                title="Chunk Embedding Space"
                datasetLabel="Chunks"
                className="h-[400px]"
              />
            </div>

            <div className="w-1/2 text-sm text-muted-foreground space-y-2 rounded-lg border border-border bg-muted/50 p-4">
              <p>
                Each chunk is 384 numbers. This map squeezes them down to two
                so they can be drawn, using a method called UMAP.
              </p>
              <p>
                <strong>Keep in mind:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  The map is approximate. Two points that look close here can
                  still score far apart in the search.
                </li>
                <li>
                  The layout changes a little each time it is drawn. Look at
                  which points cluster, not at exact positions.
                </li>
                <li>
                  This view only plots document chunks, so it represents the
                  indexed knowledge base before a user query is embedded.
                </li>
                <li>
                  Points are colored by source document. Chunks from the same
                  document tend to sit together, which is one reason a search
                  can pull several passages from one source and none from
                  another.
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chunks:</label>
            <div
              className="rounded-lg border-2 border-dashed border-muted-foreground/25"
              style={{ height: EMBEDDING_CONSTANTS.CHUNK_LIST_HEIGHT }}
            >
              <ScrollArea className="h-full p-4">
                {blocks.length > 0 ? (
                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors"
                      >
                        <p className="text-sm">{block.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Chunk {index + 1} • {block.text.length} characters
                          {strategy === "parent-child" &&
                            block.parentId !== undefined && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-medium">
                                Child of Parent {block.parentId + 1}
                              </span>
                            )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Add text in the Text Splitting tab first.
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Each chunk as a list of numbers:
            </label>
            <div
              className="rounded-lg border-2 border-dashed border-muted-foreground/25"
              style={{ height: EMBEDDING_CONSTANTS.CHUNK_LIST_HEIGHT }}
            >
              <ScrollArea className="h-full p-4">
                {loadingState.status === "embedding" ? (
                  <div className="flex items-center justify-center h-full">
                    Embedding... {embeddingProgress}%
                  </div>
                ) : blocksEmbedding.length > 0 ? (
                  <div className="space-y-4">
                    {blocksEmbedding.map((blockEmbedding, blockIndex) => (
                      <div
                        key={blockIndex}
                        className="p-3 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors"
                      >
                        <div className="text-xs space-y-1">
                          <p className="text-sm">
                            [
                            {blockEmbedding[0]
                              .slice(0, EMBEDDING_CONSTANTS.EMBEDDING_PREVIEW_COUNT)
                              .map((v) => v.toFixed(4))
                              .join(", ")}
                            ...]
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Chunk {blockIndex + 1} • {blockEmbedding[0].length}{" "}
                            numbers (showing the first 8)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {loadingState.status === "error"
                      ? `Error: ${loadingState.error}`
                      : loadingState.status !== "idle"
                      ? "Waiting for the model to download..."
                      : "No chunks to embed"}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
