import type { SplitStrategy } from "@/app/experiment/types/text-splitting";
import type { EffortLevel } from "@/app/experiment/types/generation";
import { DEFAULT_QUESTION } from "@/app/experiment/constants/embedding";

export type ScenarioTab =
  | "text-splitting"
  | "embedding"
  | "semantic-search"
  | "generation";

/**
 * A scenario preloads the whole pipeline so a class exercise does not depend
 * on everyone typing the same settings. Applying one resets the source text
 * to the four-document corpus.
 */
export interface Scenario {
  id: string;
  title: string;
  summary: string;
  watchFor: string;
  strategy: SplitStrategy;
  chunkSize: number;
  overlap: number;
  parentChunkSize?: number;
  /** Chunks shorter than this merge into their neighbor. Default 60. */
  minChunkSize?: number;
  /** Retrieval question (Semantic Search tab). */
  question: string;
  /** Message sent to the model, when it should differ from the retrieval question. */
  userMessage?: string;
  effort?: EffortLevel;
  tab: ScenarioTab;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "corpus",
    title: "Start here: four legal sources",
    summary:
      "A Fifth Circuit sanctions opinion, Federal Rule of Civil Procedure 11, a judge's standing order on generative AI, and a fictional engagement letter, split with the usual default settings.",
    watchFor:
      "Where the chunk boundaries fall. Notice which chunks carry a source header and which do not, and where a section gets cut in two.",
    strategy: "recursive-character",
    chunkSize: 500,
    overlap: 50,
    question: DEFAULT_QUESTION,
    effort: "low",
    tab: "text-splitting",
  },
  {
    id: "definition-split",
    title: "A defined term cut off from its definition",
    summary:
      "Smaller chunks, no overlap. Section 7 of the engagement letter says AI output is not a \"Verified Authority\"; Section 1 defines that term.",
    watchFor:
      "The Section 7 passages are retrieved; the Section 1 definition of \"Verified Authority\" usually is not. The model then explains a term whose definition it cannot see. Try it in Context Generation.",
    strategy: "recursive-character",
    chunkSize: 250,
    overlap: 0,
    question: "May the firm cite output from a Generative AI Tool?",
    effort: "low",
    tab: "semantic-search",
  },
  {
    id: "same-word",
    title: "Same word, different doctrine",
    summary:
      "\"Notice\" means one thing in Rule 11 (notice before sanctions) and another in the engagement letter (how to deliver a letter).",
    watchFor:
      "The top passages mix both meanings, with the engagement letter's Notices clause usually first. A similarity score measures wording, not which body of law you are asking about.",
    strategy: "recursive-character",
    chunkSize: 300,
    overlap: 0,
    question: "What notice is required?",
    effort: "low",
    tab: "semantic-search",
  },
  {
    id: "false-premise",
    title: "A premise the sources do not support",
    summary:
      "Fletcher v. Experian is a Fifth Circuit decision. The question calls it a Supreme Court case.",
    watchFor:
      "Whether the answer corrects the premise or adopts it. The system prompt tells the model to say so when a question assumes something the context does not support.",
    strategy: "recursive-character",
    chunkSize: 500,
    overlap: 50,
    question:
      "What did the Supreme Court hold in Fletcher v. Experian about AI hallucinations?",
    effort: "low",
    tab: "generation",
  },
  {
    id: "parent-child",
    title: "Parent-child retrieval",
    summary:
      "Small chunks are matched against the question, but the model receives the larger section each match came from.",
    watchFor:
      "Compare the prompt preview with the first scenario. The passages are longer and keep more of their surroundings, which is closer to what commercial tools do.",
    strategy: "parent-child",
    chunkSize: 300,
    overlap: 30,
    parentChunkSize: 1200,
    question: DEFAULT_QUESTION,
    effort: "low",
    tab: "text-splitting",
  },
];

export const DEFAULT_SCENARIO = SCENARIOS[0];
