import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pipeline, cos_sim } from "@huggingface/transformers";
import { readFileSync } from "node:fs";
import { buildBm25, reciprocalRankFusion } from "../src/lib/bm25.ts";

const PREFIX = "Represent this sentence for searching relevant passages: ";
const src = readFileSync("src/app/experiment/constants/legal-corpus.ts", "utf8");
const texts = {}; for (const m of src.matchAll(/const (\w+_TEXT) = `([\s\S]*?)`;/g)) texts[m[1]] = m[2];
const order = ["FLETCHER_TEXT","RULE_11_TEXT","STARR_ORDER_TEXT","ENGAGEMENT_LETTER_TEXT"];
const corpus = order.map((k,i)=>`=== SOURCE ${i+1}: ${k} ===\n\n${texts[k].trim()}`).join("\n\n\n");
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50, separators: ["\n\n","\n"," "] });
const raw = await splitter.splitText(corpus);
const chunks = [];
for (const t of raw) { const prev = chunks[chunks.length-1]; if (t.length < 60 && prev) prev.text += "\n\n" + t; else chunks.push({ text: t }); }
const extractor = await pipeline("feature-extraction", "Snowflake/snowflake-arctic-embed-xs");
const embed = async (t) => (await extractor(t, { normalize: true, pooling: "cls" })).tolist()[0];
const vecs = []; for (const c of chunks) vecs.push(await embed(c.text));
const bm25 = buildBm25(chunks.map((c) => c.text));
const show = (label, ranked) => { console.log(label); ranked.slice(0,4).forEach(([i,s]) => console.log(`   ${s.toFixed(3)} c${i+1} ${chunks[i].text.replace(/\s+/g,' ').slice(0,70)}`)); };
for (const q of ["What does Rule 11(c)(3) say?", "28 U.S.C. § 1927", "Harvey.AI", "What must a lawyer do before citing a case that an AI tool produced?"]) {
  const qv = await embed(PREFIX + q);
  const vec = chunks.map((c,i)=>[i, cos_sim(qv, vecs[i])]).sort((a,b)=>b[1]-a[1]);
  const kw = bm25.score(q).map((s,i)=>[i,s]).sort((a,b)=>b[1]-a[1]);
  const fused = reciprocalRankFusion([vec.map(([i])=>i), kw.filter(([,s])=>s>0).map(([i])=>i)]);
  const hy = [...fused.entries()].sort((a,b)=>b[1]-a[1]);
  console.log(`\nQ: ${q}`); show(" vector:", vec); show(" keyword:", kw); show(" hybrid (RRF):", hy);
}
