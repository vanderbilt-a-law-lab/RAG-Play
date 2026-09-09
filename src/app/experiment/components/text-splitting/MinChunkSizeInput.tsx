"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";

export const MinChunkSizeInput = () => {
  const { minChunkSize, setMinChunkSize } = useTextSplittingStore();

  return (
    <div className="flex items-center">
      <label className="flex items-center gap-2 text-sm font-medium">
        Min Chunk Size:
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label="What minimum chunk size does">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Chunks shorter than this many characters are merged into the
                chunk before them. Headings like &quot;III&quot; and sentence
                tails otherwise become chunks of their own, and tiny chunks
                score well against almost any question. Set to 0 to keep
                every fragment.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
      <Input
        type="number"
        value={minChunkSize}
        onChange={(e) => setMinChunkSize(Number(e.target.value))}
        min="0"
        max="1000"
        className="ml-2 w-24"
        aria-label="Minimum chunk size in characters"
      />
    </div>
  );
};
