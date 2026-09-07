# Legal RAG Playground

A teaching tool for law students. It shows what a legal research assistant does between your question and its answer: how documents get split into chunks, how the system picks the chunks closest to your question, and how a language model writes an answer from only those chunks. Every step is visible and editable.

Built by the [Vanderbilt AI Law Lab](https://www.vanderbilt.edu/ai-law-lab/) for the course *AI in Law Practice*. Adapted from [RAG-Play](https://github.com/Kain-90/RAG-Play) by Kain (MIT License).

## What is different from RAG-Play

- **A legal corpus.** The sample text is four sources chosen so the failure modes discussed in class can be seen in the pipeline: the Fifth Circuit's sanctions order in *Fletcher v. Experian* (Feb. 18, 2026, excerpted), Federal Rule of Civil Procedure 11, Judge Brantley Starr's standing order on generative AI (N.D. Tex.), and a fictional engagement letter with a definitions section far from the clause that uses it. Every chunk is tagged with the document it came from.
- **Scenarios.** A menu at the top of the playground preloads the corpus, the splitting settings, and a question for each class exercise, and says what to watch for.
- **Claude as the answer model**, called through the Anthropic SDK, with the effort setting exposed as a control. The response streams the model's thinking summary and its answer, and the tab reports which retrieved passages the answer cited.
- **Errors are visible.** If the model call fails (no API key, rate limit, retired model, refusal), the Generation tab says so instead of sitting on a spinner.
- **Class code and rate limit.** An optional `ACCESS_CODE` gates the model call, and each connection is limited to a few requests per minute.
- **Re-embedding is reliable.** Changing the splitting strategy or the source text re-embeds the chunks and the current question, so the ranking always refers to the chunks on screen.

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand
- [Transformers.js](https://huggingface.co/docs/transformers.js) for in-browser embeddings (Snowflake arctic-embed-xs, in a web worker)
- [LangChain text splitters](https://js.langchain.com/docs/how_to#text-splitters)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) for generation

## Running it

```bash
git clone https://github.com/vanderbilt-a-law-lab/RAG-Play
cd RAG-Play
pnpm install
cp .env.example .env      # add your ANTHROPIC_API_KEY
pnpm dev
```

Open http://localhost:3000. Phones and tablets are redirected away from `/experiment`; the embedding model needs a desktop browser.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Read by the Anthropic SDK. |
| `ANTHROPIC_MODEL` | no | Default `claude-opus-5`. Must support adaptive thinking and the effort setting. |
| `ACCESS_CODE` | no | If set, the browser must send this class code before the server calls the model. Students enter it once in the Generation tab; it is remembered in their browser. |
| `GOOGLE_SITE_VERIFICATION_ID` | no | Search Console verification. |

## Deploying on Vercel

Import the repository, add `ANTHROPIC_API_KEY` (and optionally `ACCESS_CODE`) under Settings → Environment Variables, and deploy. The generate route sets `maxDuration = 120`, which needs a Pro plan or fluid compute; lower it in `src/app/api/generate/route.ts` on a Hobby plan.

The rate limiter is in-memory, so on Vercel it is per serverless instance rather than global. That is enough to stop a runaway client; for a hard global cap, replace `src/lib/rate-limit.ts` with a Redis-backed limiter.

## Project structure

```
src/
├── app/
│   ├── api/generate/          # Streaming route: Claude via the Anthropic SDK (NDJSON events)
│   ├── experiment/
│   │   ├── components/        # The four tabs, scenario picker, message display
│   │   ├── constants/         # legal-corpus.ts, scenarios.ts, prompt-templates.ts
│   │   ├── types/             # Text splitting, embedding, and generation types
│   │   └── workers/           # Embedding web worker (Transformers.js)
│   ├── hooks/                 # useEmbeddingWorker, useGeneration
│   ├── stores/experiment/     # Zustand stores (text splitting, embedding, generation settings)
│   └── site.ts                # Site names and links
├── components/ui/             # shadcn/ui components
└── lib/                       # rate-limit.ts, utils
```

## Changing the corpus

Edit `src/app/experiment/constants/legal-corpus.ts`. Each document has a title, a short label, metadata, a source URL, and its text. The Text Splitting tab shows the documents joined together with a `=== SOURCE n: title ===` header before each one; those headers are how chunks are traced back to their source, so keep the format if you add documents. Scenarios live in `src/app/experiment/constants/scenarios.ts`.

## Roadmap

- Retrieval controls that mirror what commercial tools add on top of this pipeline: keyword-plus-vector hybrid search, metadata filters (jurisdiction, date), an in-browser reranker, and a citator flag column.
- A fifth tab that runs the retrieval loop the way deep-research products do: plan, rewrite the question, retrieve, read, decide whether to search again, synthesize with citations, then verify each assertion against the retrieved text.

## License

MIT. See LICENSE. The original RAG-Play is © Kain; this adaptation is © Vanderbilt AI Law Lab.
