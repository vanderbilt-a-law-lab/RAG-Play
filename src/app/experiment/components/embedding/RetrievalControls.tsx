"use client";

import { useMemo } from "react";
import { HelpCircle, SlidersHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmbeddingStore } from "@/app/stores/experiment/embedding-store";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";
import type { BlockSource } from "@/app/experiment/types/text-splitting";

const Help = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger aria-label="More about this setting">
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const Toggle = ({
  id,
  checked,
  onChange,
  label,
  help,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  help: string;
}) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-primary"
    />
    <span>{label}</span>
    <Help text={help} />
  </label>
);

/**
 * The switches a commercial research tool adds on top of plain similarity
 * search. All off by default, so the basic pipeline is what students see
 * first.
 */
export function RetrievalControls() {
  const { retrieval, setRetrieval } = useEmbeddingStore();
  const { blocks } = useTextSplittingStore();

  const sources = useMemo(() => {
    const seen = new Map<number, BlockSource>();
    blocks.forEach((block) => {
      if (block.source && !seen.has(block.source.index)) {
        seen.set(block.source.index, block.source);
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.index - b.index);
  }, [blocks]);

  const toggleSource = (index: number, included: boolean): void => {
    const excluded = new Set(retrieval.excludedSources);
    if (included) {
      excluded.delete(index);
    } else {
      excluded.add(index);
    }
    setRetrieval({ excludedSources: Array.from(excluded) });
  };

  return (
    <section
      aria-label="Search settings"
      className="space-y-3 rounded-lg border bg-muted/30 p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
        Search settings
        <span className="font-normal text-muted-foreground">
          (what commercial tools add on top of plain similarity search)
        </span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Toggle
          id="retrieval-hybrid"
          checked={retrieval.hybrid}
          onChange={(next) => setRetrieval({ hybrid: next })}
          label="Add keyword matching (hybrid search)"
          help="Also ranks chunks by exact word matches and merges that list with the similarity list. Helps with names, citations, and section numbers, which meaning-based search often misses."
        />
        <Toggle
          id="retrieval-rerank"
          checked={retrieval.rerank}
          onChange={(next) => setRetrieval({ rerank: next })}
          label="Re-score the top 10 with a second model (reranker)"
          help="A slower model reads your question and each passage together and gives each a relevance score, then reorders the top 10. Downloads about 25 MB the first time."
        />
        <Toggle
          id="retrieval-hide-flagged"
          checked={retrieval.hideFlagged}
          onChange={(next) => setRetrieval({ hideFlagged: next })}
          label="Hide sources a citator flags as not good law"
          help="Leaves out chunks from any source with a red citator flag, such as a rule that was never adopted or a case that was overruled. Similarity search on its own cannot tell."
        />
      </div>
      {sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-sm">
          <span className="flex items-center gap-1 font-medium">
            Search only these sources:
            <Help text="Commercial tools let you limit a search by jurisdiction, court, or document type before ranking. Untick a source to leave it out of the search entirely." />
          </span>
          {sources.map((source) => {
            const included = !retrieval.excludedSources.includes(source.index);
            const id = `retrieval-source-${source.index}`;
            return (
              <label key={source.index} htmlFor={id} className="flex cursor-pointer items-center gap-1.5">
                <input
                  id={id}
                  type="checkbox"
                  checked={included}
                  onChange={(e) => toggleSource(source.index, e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span title={source.title}>{source.shortTitle}</span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
