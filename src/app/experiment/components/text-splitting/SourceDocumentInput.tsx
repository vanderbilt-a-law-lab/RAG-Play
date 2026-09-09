"use client";
import { useEffect, useRef } from "react";
import { useTextSplittingStore } from "@/app/stores/experiment/text-splitting-store";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CorpusLegend } from "./CorpusLegend";
import { CORPUS_TEXT } from "@/app/experiment/constants/legal-corpus";

export const SourceDocumentInput = () => {
  const { text, blocks, hoveredChunkIndex, setText, resetText, setTextareaRef } =
    useTextSplittingStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCorpus = text === CORPUS_TEXT;

  // Show the hovered chunk in brackets inside the source text.
  const getHighlightedText = () => {
    if (hoveredChunkIndex === null) return text;

    const block = blocks[hoveredChunkIndex];
    if (!block) return text;
    return (
      text.slice(0, block.startIndex) +
      `[${text.slice(block.startIndex, block.endIndex)}]` +
      text.slice(block.endIndex)
    );
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  useEffect(() => {
    setTextareaRef(textareaRef);
  }, [setTextareaRef, textareaRef]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">Source Documents</label>
        {!isCorpus && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetText}
            className="h-7 text-xs"
            aria-label="Restore the five legal sources"
          >
            Restore the five sources
          </Button>
        )}
      </div>
      <CorpusLegend />
      <p className="text-xs text-muted-foreground">
        You can edit this text or paste your own document. Lines that begin
        with <code>=== SOURCE</code> mark where each document starts.
      </p>
      <Textarea
        ref={textareaRef}
        value={getHighlightedText()}
        onChange={handleTextChange}
        className="min-h-screen resize-y border-2 border-dashed border-muted-foreground/25 font-mono focus-visible:ring-1"
        placeholder="Paste a document to split here..."
        aria-label="Source document text"
      />
    </div>
  );
};
