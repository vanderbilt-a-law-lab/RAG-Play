import type { SplitStrategy } from "@/app/experiment/types/text-splitting";
import type { EffortLevel } from "@/app/experiment/types/generation";
import type { RetrievalSettings } from "@/app/stores/experiment/embedding-store";
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
  /** Retrieval toggles to switch on for this scenario; everything else resets to off. */
  retrieval?: Partial<RetrievalSettings>;
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
    title: "Start here: five legal sources",
    summary:
      "A Fifth Circuit sanctions opinion, Federal Rule of Civil Procedure 11, a judge's standing order on generative AI, a fictional engagement letter, and a proposed rule that was never adopted, split with the usual default settings.",
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

SCENARIOS.push(
  {
    id: "exact-name",
    title: "Names and citations: keyword vs. meaning",
    summary:
      "Meaning-based search is weakest on exact names, citations, and section numbers. Hybrid search adds keyword matching.",
    watchFor:
      "With keyword matching on, the passage that names Harvey.AI is first. Turn it off under Search settings: similarity alone ranks it lower, behind passages about AI in general.",
    strategy: "recursive-character",
    chunkSize: 500,
    overlap: 50,
    retrieval: { hybrid: true },
    question: "Where is Harvey.AI mentioned?",
    effort: "low",
    tab: "semantic-search",
  },
  {
    id: "not-adopted",
    title: "A rule that was never adopted",
    summary:
      "The Fifth Circuit proposed an AI-certification rule in 2023 and then declined to adopt it. The proposal reads like a rule, and similarity search treats it like one.",
    watchFor:
      "The proposed rule takes the top spots with a red \"Not adopted\" flag. Nothing in the similarity score says it never became law. Tick \"Hide sources a citator flags\" under Search settings and watch it disappear, then generate an answer and see whether the model repeats the warning.",
    strategy: "recursive-character",
    chunkSize: 500,
    overlap: 50,
    question:
      "What must the certificate of compliance say about generative artificial intelligence?",
    effort: "low",
    tab: "semantic-search",
  },
  {
    id: "reranker",
    title: "A second look: the reranker",
    summary:
      "A slower model rereads the top 10 passages together with your question and rescores them.",
    watchFor:
      "The \"was #n\" labels show what moved. The reranker downloads once (about 25 MB). Commercial tools run a step like this before anything reaches the model.",
    strategy: "recursive-character",
    chunkSize: 500,
    overlap: 50,
    retrieval: { rerank: true },
    question: "How much was the sanction?",
    effort: "low",
    tab: "semantic-search",
  }
);

export const DEFAULT_SCENARIO = SCENARIOS[0];
