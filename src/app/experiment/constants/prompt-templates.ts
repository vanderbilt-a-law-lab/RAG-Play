/** One retrieved chunk, numbered so the model can cite it. */
export interface ContextPassage {
  number: number;
  sourceTitle: string | null;
  /** Citator label to show the model, e.g. "Not adopted". Only for flagged sources. */
  citatorLabel?: string | null;
  text: string;
}

export const formatPassage = (passage: ContextPassage): string => {
  const flag = passage.citatorLabel ? ` [Citator: ${passage.citatorLabel}]` : "";
  const header = passage.sourceTitle
    ? `[${passage.number}] Source: ${passage.sourceTitle}${flag}`
    : `[${passage.number}]${flag}`;
  return `${header}\n${passage.text.trim()}`;
};

export const SYSTEM_PROMPT_TEMPLATE = (passages: ContextPassage[]): string => {
  const hasFlags = passages.some((p) => p.citatorLabel);
  const rules = [
    "- Use only the passages below. If you don't know the answer, just say that you don't know. Don't try to make up an answer.",
    "- After each statement you take from a passage, cite the passage number in square brackets, like [2].",
    "- If the question assumes something the passages do not support, say so instead of going along with it.",
    ...(hasFlags
      ? [
          '- A passage marked "Citator:" comes with a warning about whether its source can be relied on. Repeat that warning if you use the passage.',
        ]
      : []),
  ];
  return `You are a research assistant in a law office. Answer the user's question using only the numbered passages below. Each passage was retrieved from a longer document; you do not have the rest of that document.

Rules:
${rules.join("\n")}

Passages:
${passages.map(formatPassage).join("\n\n")}`.trim();
};

export const USER_PROMPT_TEMPLATE = (question: string): string => question;

/** Passage numbers the model cited, parsed from its answer. */
export const extractCitedNumbers = (answer: string): Set<number> => {
  const cited = new Set<number>();
  const pattern = /\[(\d{1,2})\]/g;
  let match = pattern.exec(answer);
  while (match !== null) {
    cited.add(Number(match[1]));
    match = pattern.exec(answer);
  }
  return cited;
};
