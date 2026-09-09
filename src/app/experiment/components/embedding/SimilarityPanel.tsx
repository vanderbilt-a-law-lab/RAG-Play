import { Fragment, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  CitatorStatus,
  EnhancedTextBlock,
} from "@/app/experiment/types/text-splitting";
import type {
  RankedChunk,
  RerankStatus,
  RetrievalSettings,
} from "@/app/stores/experiment/embedding-store";
import { EMBEDDING_CONSTANTS } from "@/app/hooks";
import { queryTerms } from "@/lib/bm25";
import { cn } from "@/lib/utils";

interface SimilarityPanelProps {
  similarities: RankedChunk[];
  blocks: EnhancedTextBlock[];
  isLoading: boolean;
  query: string;
  retrieval: RetrievalSettings;
  rerankStatus: RerankStatus;
}

const CITATOR_STYLES: Record<CitatorStatus, string> = {
  good: "bg-green-100 text-green-800",
  caution: "bg-amber-100 text-amber-900",
  negative: "bg-red-100 text-red-800",
  none: "bg-muted text-muted-foreground",
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wrap every occurrence of a query term in <mark>. */
const highlightTerms = (text: string, terms: string[]) => {
  const usable = terms.filter((t) => t.length >= 3).map(escapeRegExp);
  if (usable.length === 0) {
    return text;
  }
  const splitter = new RegExp(`(${usable.join("|")})`, "gi");
  const tester = new RegExp(`^(${usable.join("|")})$`, "i");
  return text.split(splitter).map((part, i) =>
    tester.test(part) ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
};

const describeScores = (
  item: RankedChunk,
  position: number,
  retrieval: RetrievalSettings
): string => {
  const parts: string[] = [];
  const showVectorRank = retrieval.hybrid || item.rerankScore !== undefined;
  parts.push(
    `similarity ${item.similarity.toFixed(3)}${
      showVectorRank ? ` (#${item.vectorRank} by similarity alone)` : ""
    }`
  );
  if (retrieval.hybrid) {
    parts.push(
      item.keywordRank
        ? `keyword match #${item.keywordRank}`
        : "no keyword match"
    );
  }
  if (item.rerankScore !== undefined) {
    const moved =
      item.rankBeforeRerank && item.rankBeforeRerank !== position + 1
        ? ` (was #${item.rankBeforeRerank})`
        : "";
    parts.push(`reranker ${item.rerankScore.toFixed(2)}${moved}`);
  }
  return parts.join(" · ");
};

export function SimilarityPanel({
  similarities,
  blocks,
  isLoading,
  query,
  retrieval,
  rerankStatus,
}: SimilarityPanelProps) {
  const terms = useMemo(() => queryTerms(query), [query]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-sm font-medium">
          Ranked passages (top {EMBEDDING_CONSTANTS.SIMILARITY_TOP_N}):
        </label>
        <span className="text-xs text-muted-foreground">
          {rerankStatus === "pending"
            ? "Reranker is rescoring the top 10..."
            : rerankStatus === "error"
              ? "The reranker could not run; showing the ranking without it."
              : "Words from your question are highlighted."}
        </span>
      </div>
      <div
        className="rounded-lg border-2 border-dashed border-muted-foreground/25"
        style={{ height: EMBEDDING_CONSTANTS.CHUNK_LIST_HEIGHT }}
      >
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              Working...
            </div>
          ) : similarities.length > 0 && blocks.length > 0 ? (
            <div className="space-y-2">
              {similarities
                .slice(0, EMBEDDING_CONSTANTS.SIMILARITY_TOP_N)
                .filter(({ index }) => index < blocks.length && blocks[index])
                .map((item, position) => {
                  const block = blocks[item.index];
                  const citator = block.source?.citator;
                  return (
                    <div
                      key={item.index}
                      className="rounded-md bg-muted/50 p-3 transition-colors hover:bg-muted/80"
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-foreground px-1.5 py-0.5 font-semibold text-background">
                          #{position + 1}
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
                        {citator && (
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 font-medium",
                              CITATOR_STYLES[citator.status]
                            )}
                            title={citator.note}
                          >
                            {citator.label}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          Chunk {item.index + 1} · {describeScores(item, position, retrieval)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">
                        {highlightTerms(block.text, terms)}
                      </p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {blocks.length === 0
                ? "No chunks available."
                : "Type a question to see the ranked passages"}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
