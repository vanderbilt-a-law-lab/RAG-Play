import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFileSync } from "node:fs";
const src = readFileSync("src/app/experiment/constants/legal-corpus.ts", "utf8");
const texts = {};
for (const m of src.matchAll(/const (\w+_TEXT) = `([\s\S]*?)`;/g)) texts[m[1]] = m[2];
const titles = {
  FLETCHER_TEXT: "Fletcher v. Experian Information Solutions, Inc., No. 25-20086 (5th Cir. Feb. 18, 2026) (sanctions order)",
  RULE_11_TEXT: "Federal Rule of Civil Procedure 11",
  STARR_ORDER_TEXT: "Judge Brantley Starr (N.D. Tex.), Mandatory Certification Regarding Generative Artificial Intelligence (judge-specific requirement, first posted May 30, 2023)",
  ENGAGEMENT_LETTER_TEXT: "Engagement Letter, Cumberland & Ross LLP to Sablefield Robotics, Inc. (fictional teaching document, Mar. 2, 2026)",
};
const order = ["FLETCHER_TEXT","RULE_11_TEXT","STARR_ORDER_TEXT","ENGAGEMENT_LETTER_TEXT"];
const corpus = order.map((k,i)=>`=== SOURCE ${i+1}: ${titles[k]} ===\n\n${texts[k].trim()}`).join("\n\n\n");
for (const [size, overlap] of [[500,50],[250,0]]) {
  const s = new RecursiveCharacterTextSplitter({ chunkSize: size, chunkOverlap: overlap, separators: ["\n\n","\n"," "] });
  const chunks = await s.splitText(corpus);
  const small = chunks.map((c,i)=>[i+1,c.length,c.replace(/\s+/g,' ').slice(0,60)]).filter(([,n])=>n<80);
  console.log(`--- ${size}/${overlap}: ${chunks.length} chunks; ${small.length} under 80 chars ---`);
  for (const [i,n,t] of small) console.log(`  c${i} (${n}): ${t}`);
}
