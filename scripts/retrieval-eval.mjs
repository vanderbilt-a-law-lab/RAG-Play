// Offline replica of the playground's retrieval step, for testing changes to
// the corpus and the ranking without a browser. Same splitter settings as the
// app. Env: MODEL (hf id), POOL (cls|mean), MIN (merge chunks shorter than N
// chars into the previous chunk), PREFIX (query prefix), TOPN, SETTINGS (e.g. "500/50,250/0").
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline, cos_sim } from "@huggingface/transformers";
import { readFileSync } from "node:fs";

const MODEL = process.env.MODEL || "Snowflake/snowflake-arctic-embed-xs";
const POOL = process.env.POOL || "cls";
const MIN = Number(process.env.MIN || 0);
const PREFIX = process.env.PREFIX || "";
const TOPN = Number(process.env.TOPN || 3);
const SETTINGS = (process.env.SETTINGS || "500/50,250/0").split(",").map((s) => s.split("/").map(Number));

const src = readFileSync("src/app/experiment/constants/legal-corpus.ts", "utf8");
const texts = {};
for (const m of src.matchAll(/const (\w+_TEXT) = `([\s\S]*?)`;/g)) texts[m[1]] = m[2];
const docs = [
  ["Fletcher", "FLETCHER_TEXT", "Fletcher v. Experian Information Solutions, Inc., No. 25-20086 (5th Cir. Feb. 18, 2026) (sanctions order)"],
  ["Rule11", "RULE_11_TEXT", "Federal Rule of Civil Procedure 11"],
  ["Starr", "STARR_ORDER_TEXT", "Judge Brantley Starr (N.D. Tex.), Mandatory Certification Regarding Generative Artificial Intelligence (judge-specific requirement, first posted May 30, 2023)"],
  ["Letter", "ENGAGEMENT_LETTER_TEXT", "Engagement Letter, Cumberland & Ross LLP to Sablefield Robotics, Inc. (fictional teaching document, Mar. 2, 2026)"],
  ["Proposed", "PROPOSED_RULE_TEXT", "Proposed Amendment to 5th Cir. R. 32.3 and Form 6, Notice for Public Comment (Nov. 2023) (never adopted)"],
];
const corpus = docs.map(([, k, title], i) => `=== SOURCE ${i + 1}: ${title} ===\n\n${texts[k].trim()}`).join("\n\n\n");
const ranges = [];
for (const m of corpus.matchAll(/^=== SOURCE (\d+): .+? ===$/gm)) ranges.push({ i: Number(m[1]), start: m.index });
const docOf = (offset) => { let d = ranges[0]; for (const r of ranges) if (offset >= r.start) d = r; return docs[d.i - 1][0]; };

const QUERIES = (process.env.QUERIES ? process.env.QUERIES.split("|") : [
  "What must a lawyer do before citing a case that an AI tool produced?",
  "What notice is required?",
  "How much was the sanction?",
  "Does the engagement letter allow entering client data into ChatGPT?",
  "What are the elements of a breach of contract claim?",
  "Under the engagement letter, may the firm cite an authority that is not a Verified Authority?",
  "What must be filed with a notice of appearance?",
  "Who is responsible for a filing drafted by AI?",
]);

const mergeTiny = (chunks, min) => {
  if (min <= 0) return chunks;
  const out = [];
  for (const c of chunks) {
    const prev = out[out.length - 1];
    if (c.text.length < min && prev && prev.doc === c.doc) {
      const prev = out[out.length - 1];
      prev.text = prev.text + "\n\n" + c.text;
      prev.merged = (prev.merged || 0) + 1;
    } else {
      out.push({ ...c });
    }
  }
  return out;
};

const extractor = await pipeline("feature-extraction", MODEL);
const embed = async (t) => (await extractor(t, { normalize: true, pooling: POOL })).tolist()[0];
console.log(`MODEL=${MODEL} POOL=${POOL} MIN=${MIN} PREFIX=${PREFIX ? "yes" : "no"}`);

for (const [size, overlap] of SETTINGS) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: size, chunkOverlap: overlap, separators: ["\n\n", "\n", " "] });
  // Each source is split on its own, as the app does, so no chunk spans two documents.
  const segments = ranges.map((r, i) => ({ doc: docs[r.i - 1][0], text: corpus.slice(r.start, i + 1 < ranges.length ? ranges[i + 1].start : corpus.length) }));
  const chunks = [];
  for (const seg of segments) {
    for (const text of await splitter.splitText(seg.text)) chunks.push({ n: chunks.length + 1, text, doc: seg.doc });
  }
  const kept = mergeTiny(chunks, MIN);
  const vecs = [];
  for (const c of kept) vecs.push(await embed(c.text));
  console.log(`\n=== ${size}/${overlap}: ${chunks.length} chunks -> ${kept.length} after merge ===`);
  for (const q of QUERIES) {
    const qv = await embed(PREFIX + q);
    const ranked = kept.map((c, i) => ({ c, s: cos_sim(qv, vecs[i]) })).sort((a, b) => b.s - a.s).slice(0, TOPN);
    console.log(`Q: ${q}`);
    for (const { c, s } of ranked) console.log(`   ${s.toFixed(3)} ${c.doc.padEnd(8)} c${String(c.n).padEnd(3)} (${String(c.text.length).padStart(3)}) ${c.text.replace(/\s+/g, " ").slice(0, 64)}`);
  }
}
