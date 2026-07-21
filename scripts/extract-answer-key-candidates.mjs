#!/usr/bin/env node

// Produces model-coded candidates for human review. It never admits evidence automatically.
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const model = process.env.EXTRACTION_MODEL ?? "gpt-4o-mini";
const pilotQuestions = (process.env.QUESTION_IDS ?? "57,70,64,8,92,59,90,100,77,82").split(",").map(Number);

function parseEnv(s) {
  return Object.fromEntries(s.split(/\r?\n/).map(x => x.trim()).filter(x => x && !x.startsWith("#") && x.includes("=")).map(x => {
    const i = x.indexOf("="); return [x.slice(0, i), x.slice(i + 1).replace(/^['"]|['"]$/g, "")];
  }));
}
const env = parseEnv(await readFile(new URL("local.env", root), "utf8").catch(() => readFile(new URL(".env.local", root), "utf8").catch(() => "")));
const apiKey = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY not found");

const retrieval = JSON.parse(await readFile(new URL("research/answer-key-retrieval-candidates.json", root), "utf8"));
const codebook = JSON.parse(await readFile(new URL("src/data/codebook.json", root), "utf8"));
const groundIds = codebook.flatMap(b => b.leaves.map(l => l.id));
const groundGlossary = codebook.flatMap(b => b.leaves.map(l => `${l.id}: ${l.definition}`)).join("\n");
const selected = retrieval.results.filter(r => pilotQuestions.includes(r.question_id));
if (!selected.length) throw new Error("No selected questions found in retrieval output");

const schema = {
  type: "object", additionalProperties: false,
  properties: {
    assessments: { type: "array", items: {
      type: "object", additionalProperties: false,
      properties: {
        chunk_id: { type: "string" },
        fit: { type: "string", enum: ["direct", "near", "rejected"] },
        verdict: { type: ["string", "null"], enum: ["frees", "binds", "mixed", "neither", null] },
        primary_ground_id: { anyOf: [{ type: "string", enum: groundIds }, { type: "null" }] },
        evidence_quote: { type: ["string", "null"] },
        position_summary: { type: ["string", "null"] },
        rationale: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 }
      },
      required: ["chunk_id", "fit", "verdict", "primary_ground_id", "evidence_quote", "position_summary", "rationale", "confidence"]
    }}
  }, required: ["assessments"]
};

const outputUrl = new URL("research/answer-key-model-coded-pilot.json", root);
const previous = JSON.parse(await readFile(outputUrl, "utf8").catch(() => "null"));
const outputs = previous?.questions ?? [];
let usage = { input_tokens: previous?.meta?.input_tokens ?? 0, output_tokens: previous?.meta?.output_tokens ?? 0 };
async function checkpoint() {
  const result = { meta: { status: "model-coded-candidates-for-human-review", benchmark_ready: false, model, created_at: new Date().toISOString(), retrieval_run: retrieval.run.id, question_count: outputs.length, ...usage, method: "Embedding retrieval followed by structured passage coding. No candidate is admitted until human review." }, questions: outputs };
  await writeFile(outputUrl, JSON.stringify(result, null, 2) + "\n");
}
for (const item of selected) {
  if (outputs.some(q => q.question_id === item.question_id)) { console.log(`Kept Q${item.question_id}`); continue; }
  const candidates = item.candidates.map(c => ({ chunk_id: c.id, source_id: c.sourceId, similarity: c.cosine_similarity, excerpt: c.excerpt }));
  const prompt = `Question Q${item.question_id}: ${item.question}\n\nCandidate passages:\n${JSON.stringify(candidates)}\n\nCodebook grounds:\n${groundGlossary}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, store: false,
      instructions: "You are coding historical evidence for a benchmark. Assess every candidate independently. DIRECT means the passage itself takes a position that answers the question, not merely that it shares a topic. NEAR means useful context without an answer. REJECTED means irrelevant or retrieval noise. Only DIRECT evidence receives a verdict, ground, quote, and position summary. The quote must be copied exactly from the supplied excerpt. 'Frees' and 'binds' refer to whether the passage's answer preserves/expands or constrains/erodes the human autonomy at issue. Use mixed or neither only when unavoidable. Do not infer an author's position beyond the passage.",
      input: prompt,
      text: { format: { type: "json_schema", name: "historical_evidence_assessment", strict: true, schema } }
    })
  });
  if (!response.ok) throw new Error(`Q${item.question_id} extraction failed ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  usage.input_tokens += payload.usage?.input_tokens ?? 0; usage.output_tokens += payload.usage?.output_tokens ?? 0;
  const text = payload.output?.flatMap(o => o.content ?? []).find(c => c.type === "output_text")?.text;
  if (!text) throw new Error(`Q${item.question_id}: no structured output`);
  const parsed = JSON.parse(text);
  const byId = new Map(item.candidates.map(c => [c.id, c]));
  outputs.push({
    question_id: item.question_id, question: item.question,
    assessments: parsed.assessments.map(a => {
      const candidate = byId.get(a.chunk_id);
      const quoteVerified = !a.evidence_quote || candidate?.excerpt.includes(a.evidence_quote);
      return { ...a, quote_verified_exactly: quoteVerified, human_decision: "pending", retrieval: candidate };
    })
  });
  await checkpoint();
  console.log(`Coded Q${item.question_id}`);
}
console.log("Wrote research/answer-key-model-coded-pilot.json");
