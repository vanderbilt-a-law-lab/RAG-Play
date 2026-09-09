/**
 * A small BM25 keyword index over chunk texts. Used for the hybrid-search
 * toggle so students can see keyword and vector rankings side by side.
 */

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "is", "it", "its", "of", "on", "or", "that", "the", "this", "to", "was",
  "were", "will", "with", "what", "which", "who", "whom", "how", "does", "do",
  "did", "must", "may", "can", "should", "would", "could", "not", "no", "any",
  "about", "into", "under", "before", "after", "if", "than", "then", "there",
  "their", "they", "them", "these", "those", "when", "where", "why", "i", "we",
  "you", "he", "she", "his", "her", "our", "your", "s",
]);

export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9§$.]+/)
    .map((t) => t.replace(/^[.$]+|[.$]+$/g, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

/** Query terms worth highlighting or matching: tokens minus stopwords. */
export const queryTerms = (query: string): string[] =>
  Array.from(new Set(tokenize(query)));

export interface Bm25Index {
  score: (query: string) => number[];
  size: number;
}

export const buildBm25 = (
  texts: string[],
  k1 = 1.2,
  b = 0.75
): Bm25Index => {
  const docs = texts.map(tokenize);
  const docLengths = docs.map((d) => d.length);
  const avgLength =
    docLengths.reduce((a, n) => a + n, 0) / Math.max(1, docLengths.length);
  const docFrequency = new Map<string, number>();
  const termFrequencies = docs.map((d) => {
    const tf = new Map<string, number>();
    d.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    tf.forEach((_, t) => docFrequency.set(t, (docFrequency.get(t) ?? 0) + 1));
    return tf;
  });
  const n = docs.length;

  const idf = (term: string): number => {
    const df = docFrequency.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  };

  return {
    size: n,
    score: (query: string) => {
      const terms = queryTerms(query);
      return docs.map((_, i) => {
        const tf = termFrequencies[i];
        const len = docLengths[i];
        let s = 0;
        for (const term of terms) {
          const f = tf.get(term) ?? 0;
          if (f === 0) continue;
          s += idf(term) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * len) / avgLength)));
        }
        return s;
      });
    },
  };
};

/**
 * Reciprocal rank fusion of two rankings. Each input is an array of chunk
 * indexes in rank order. Returns fused scores by chunk index.
 */
export const reciprocalRankFusion = (
  rankings: number[][],
  k = 60
): Map<number, number> => {
  const fused = new Map<number, number>();
  rankings.forEach((ranking) => {
    ranking.forEach((index, rank) => {
      fused.set(index, (fused.get(index) ?? 0) + 1 / (k + rank + 1));
    });
  });
  return fused;
};
