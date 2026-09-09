import {
  SplitStrategy,
  EnhancedTextBlock,
  Separator,
} from "@/app/experiment/types/text-splitting";
import {
  CharacterTextSplitter,
  RecursiveCharacterTextSplitter,
} from "@langchain/textsplitters";

const DEFAULT_PARENT_SIZE_MULTIPLIER = 2;

class SplitError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "SplitError";
  }
}

function getSeparatorList(separators: Separator | Separator[]): string[] {
  if (Array.isArray(separators)) {
    return separators.map((sep) => sep.char);
  }
  return [separators.char];
}

function getFirstSeparator(separators: Separator | Separator[]): string {
  if (Array.isArray(separators)) {
    return separators[0].char;
  }
  return separators.char;
}

type SplitTextResult = {
  blocks: EnhancedTextBlock[];
  error?: Error;
};

/**
 * Merge chunks shorter than `minChars` into the chunk before them (within the
 * same parent for parent-child). Headings, section numbers, and sentence
 * tails otherwise become their own chunks, and such fragments score well
 * against almost any question.
 */
export const mergeTinyBlocks = (
  text: string,
  blocks: EnhancedTextBlock[],
  minChars: number,
  /** Offsets where a new source document starts; merges never cross one. */
  boundaries: number[] = []
): EnhancedTextBlock[] => {
  if (minChars <= 0) {
    return blocks;
  }
  const crossesBoundary = (from: number, to: number): boolean =>
    boundaries.some((b) => b > from && b <= to);
  const merged: EnhancedTextBlock[] = [];
  for (const block of blocks) {
    const previous = merged[merged.length - 1];
    const sameParent =
      previous !== undefined && previous.parentId === block.parentId;
    const sameSource =
      previous !== undefined &&
      !crossesBoundary(previous.startIndex, block.startIndex);
    if (block.text.length < minChars && previous && sameParent && sameSource) {
      previous.endIndex = block.endIndex;
      previous.text = text.slice(previous.startIndex, block.endIndex);
    } else {
      merged.push({ ...block });
    }
  }
  return merged;
};

export interface SplitOptions {
  chunkSize: number;
  overlap: number;
  separators: Separator | Separator[];
  parentChunkSize?: number;
  minChunkSize?: number;
  /**
   * Start offsets of source documents. Each document is split on its own, the
   * way a real index treats separate documents, so no chunk ever spans two.
   */
  sourceStarts?: number[];
}

/**
 * Split the whole text. When source boundaries are given, every document is
 * split separately and the results are stitched back together with their
 * offsets into the full text.
 */
export const splitText = async (
  text: string,
  strategy: SplitStrategy,
  options: SplitOptions
): Promise<SplitTextResult> => {
  const starts = Array.from(
    new Set((options.sourceStarts ?? []).filter((n) => n > 0 && n < text.length))
  ).sort((a, b) => a - b);
  if (starts.length === 0) {
    return splitSegment(text, strategy, options);
  }
  const edges = [0, ...starts, text.length];
  const blocks: EnhancedTextBlock[] = [];
  let parentOffset = 0;
  for (let i = 0; i + 1 < edges.length; i++) {
    const [from, to] = [edges[i], edges[i + 1]];
    const segment = text.slice(from, to);
    const result = await splitSegment(segment, strategy, options);
    if (result.error) {
      return { blocks: [], error: result.error };
    }
    let maxParent = -1;
    for (const block of result.blocks) {
      const parentId =
        block.parentId === undefined ? undefined : block.parentId + parentOffset;
      if (block.parentId !== undefined) {
        maxParent = Math.max(maxParent, block.parentId);
      }
      blocks.push({
        ...block,
        startIndex: block.startIndex + from,
        endIndex: block.endIndex + from,
        parentId,
      });
    }
    parentOffset += maxParent + 1;
  }
  return { blocks };
};

const splitSegment = async (
  text: string,
  strategy: SplitStrategy,
  options: SplitOptions
): Promise<SplitTextResult> => {
  try {
    if (!text || text.trim().length === 0) {
      return { blocks: [] };
    }
    const minChunkSize = options.minChunkSize ?? 0;
    const sourceStarts: number[] = [];

    const separatorList = getSeparatorList(options.separators);
    const splitterConfig = {
      chunkSize: options.chunkSize,
      chunkOverlap: options.overlap,
    };

    let splitter;
    switch (strategy) {
      case "character":
        splitter = new CharacterTextSplitter({
          ...splitterConfig,
          separator: getFirstSeparator(options.separators),
        });
        break;
      case "recursive-character":
        splitter = new RecursiveCharacterTextSplitter({
          ...splitterConfig,
          separators: separatorList,
        });
        break;
      case "parent-child": {
        const parentChunkSize =
          options.parentChunkSize || options.chunkSize * DEFAULT_PARENT_SIZE_MULTIPLIER;

        const parentSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: parentChunkSize,
          chunkOverlap: 0,
          separators: separatorList,
        });

        const parentChunks = await parentSplitter.splitText(text);

        const allChildBlocks: EnhancedTextBlock[] = [];
        const parentStartIndexMap = new Map<number, number>();

        for (let parentIndex = 0; parentIndex < parentChunks.length; parentIndex++) {
          const parentText = parentChunks[parentIndex];
          const parentStartIndex = text.indexOf(parentText, parentIndex === 0 ? 0 : parentStartIndexMap.get(parentIndex - 1) ?? 0);
          parentStartIndexMap.set(parentIndex, parentStartIndex);

          const childSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: options.chunkSize,
            chunkOverlap: options.overlap,
            separators: separatorList,
          });

          const childChunks = await childSplitter.splitText(parentText);

          for (const childText of childChunks) {
            const relativeStartIndex = parentText.indexOf(childText);
            const absoluteStartIndex = parentStartIndex + relativeStartIndex;
            const absoluteEndIndex = absoluteStartIndex + childText.length;

            allChildBlocks.push({
              text: childText,
              startIndex: absoluteStartIndex,
              endIndex: absoluteEndIndex,
              parentId: parentIndex,
              parentText,
            });
          }
        }

        return {
          blocks: mergeTinyBlocks(text, allChildBlocks, minChunkSize, sourceStarts),
        };
      }
      default:
        return {
          blocks: [],
          error: new SplitError("Invalid split strategy", "INVALID_STRATEGY"),
        };
    }

    const chunks = await splitter.splitText(text);
    let currentIndex = 0;
    const blocks = chunks.map((chunk) => {
      const startIndex = text.indexOf(chunk, currentIndex);
      const endIndex = startIndex + chunk.length;
      currentIndex = startIndex + 1;
      return {
        text: chunk,
        startIndex,
        endIndex,
      };
    });
    return { blocks: mergeTinyBlocks(text, blocks, minChunkSize, sourceStarts) };
  } catch (error) {
    return {
      blocks: [],
      error: error as Error,
    };
  }
};
