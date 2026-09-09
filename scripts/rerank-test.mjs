import { AutoModelForSequenceClassification, AutoTokenizer } from "@huggingface/transformers";
const id = "mixedbread-ai/mxbai-rerank-xsmall-v1";
const t0 = Date.now();
const tokenizer = await AutoTokenizer.from_pretrained(id);
const model = await AutoModelForSequenceClassification.from_pretrained(id, { dtype: "q8" });
console.log("loaded in", Date.now() - t0, "ms");
const query = "How much was the sanction?";
const docs = [
  "IT IS ORDERED that Heather Hersh shall pay $2,500 in sanctions to the United States Court of Appeals for the Fifth Circuit within 30 days of this order.",
  "(4) Nature of a Sanction. A sanction imposed under this rule must be limited to what suffices to deter repetition of the conduct.",
  "9. Notices. Notices under this letter must be in writing and delivered by hand, by courier, or by email with confirmation of receipt.",
  "These factors do not counsel against sanctions here.",
];
const inputs = tokenizer(new Array(docs.length).fill(query), { text_pair: docs, padding: true, truncation: true });
const { logits } = await model(inputs);
const scores = logits.sigmoid().tolist().map((x) => x[0]);
docs.forEach((d, i) => console.log(scores[i].toFixed(3), d.slice(0, 70)));
