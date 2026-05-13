export interface ExtractRedactedThinkingResult {
  /** Markdown / text with all closed thinking blocks removed; unclosed block stripped from visible tail */
  visibleMarkdown: string;
  /** Concatenated inner contents of every `<think>` segment (in order), or null if none */
  thinkingContent: string | null;
  /** False while an opening tag has no matching closing tag yet (streaming) */
  thinkingComplete: boolean;
}

const REDACTED_THINKING_OPEN = "<think>";
const REDACTED_THINKING_CLOSE = "</think>";

export const extractRedactedThinking = (
  raw: string
): ExtractRedactedThinkingResult => {
  let visible = raw;
  const thinkingChunks: string[] = [];
  let thinkingComplete = true;

  while (true) {
    const start = visible.indexOf(REDACTED_THINKING_OPEN);
    if (start === -1) {
      break;
    }

    const before = visible.slice(0, start);
    const afterOpen = visible.slice(start + REDACTED_THINKING_OPEN.length);
    const end = afterOpen.indexOf(REDACTED_THINKING_CLOSE);

    if (end === -1) {
      thinkingChunks.push(afterOpen);
      visible = before;
      thinkingComplete = false;
      break;
    }

    thinkingChunks.push(afterOpen.slice(0, end));
    visible =
      before + afterOpen.slice(end + REDACTED_THINKING_CLOSE.length);
  }

  const thinkingContent =
    thinkingChunks.length > 0 ? thinkingChunks.join("\n\n---\n\n") : null;

  return {
    visibleMarkdown: visible,
    thinkingContent,
    thinkingComplete,
  };
};
