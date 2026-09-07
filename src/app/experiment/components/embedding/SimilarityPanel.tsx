import { ScrollArea } from "@/components/ui/scroll-area";
import { EnhancedTextBlock } from "@/app/experiment/types/text-splitting";
import { EMBEDDING_CONSTANTS } from "@/app/hooks";

interface SimilarityResult {
  index: number;
  similarity: number;
}

interface SimilarityPanelProps {
  similarities: SimilarityResult[];
  blocks: EnhancedTextBlock[];
  isLoading: boolean;
}

export function SimilarityPanel({
  similarities,
  blocks,
  isLoading,
}: SimilarityPanelProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Ranked passages:</label>
      <div
        className="rounded-lg border-2 border-dashed border-muted-foreground/25"
        style={{ height: EMBEDDING_CONSTANTS.CHUNK_LIST_HEIGHT }}
      >
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              Embedding...
            </div>
          ) : similarities.length > 0 && blocks.length > 0 ? (
            <div className="space-y-2">
              {similarities
                .slice(0, EMBEDDING_CONSTANTS.SIMILARITY_TOP_N)
                .filter(({ index }) => index < blocks.length && blocks[index])
                .map(({ index, similarity }, rank) => {
                  const block = blocks[index];
                  return (
                    <div
                      key={index}
                      className="rounded-md bg-muted/50 p-3 transition-colors hover:bg-muted/80"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-foreground px-1.5 py-0.5 font-semibold text-background">
                          #{rank + 1}
                        </span>
                        {block.source ? (
                          <span
                            className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-800"
                            title={block.source.title}
                          >
                            {block.source.shortTitle}
                          </span>
                        ) : (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            Source unknown
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          Chunk {index + 1} · similarity {similarity.toFixed(4)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{block.text}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {blocks.length === 0
                ? "No chunks available."
                : "Ask a question to see the ranked passages"}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
