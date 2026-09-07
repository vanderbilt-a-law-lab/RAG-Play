/** One retrieved chunk, numbered so the model can cite it. */
export interface ContextPassage {
  number: number;
  sourceTitle: string | null;
  text: string;
}

export const formatPassage = (passage: ContextPassage): string => {
  const header = passage.sourceTitle
    ? `[${passage.number}] Source: ${passage.sourceTitle}`
    : `[${passage.number}]`;
  return `${header}\n${passage.text.trim()}`;
};

export const SYSTEM_PROMPT_TEMPLATE = (passages: ContextPassage[]): string =>
  `You are a research assistant in a law office. Use the following pieces of context to answer the user's question. Each piece is a passage retrieved from a longer document; you do not have the rest of that document.

Rules:
- Rely only on the context. If you don't know the answer, just say that you don't know. Don't try to make up an answer.
- Cite each passage you rely on by its number in square brackets, like [2].
- If the question assumes something the context does not support, say so instead of going along with it.

Context:
${passages.map(formatPassage).join("\n\n")}`.trim();

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
