#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-large";
const MAX_USD = Number(process.env.MAX_EMBEDDING_USD ?? "1");
// Conservative relative to the July 2026 OpenAI guide's pages-per-dollar figure.
const ESTIMATED_USD_PER_MILLION_TOKENS = 0.15;
const TOP_K = 5;

const modernPath = new URL(
  "../research/modern-bank-pilot/modern_questions.json",
  import.meta.url,
);
const historicalPath = new URL("../src/data/question_bank.json", import.meta.url);
const outputPath = new URL(
  "../research/modern-bank-pilot/pairing_candidates.json",
  import.meta.url,
);

function parseEnv(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf("=");
    if (split < 1) continue;
    const key = line.slice(0, split).trim();
    let value = line.slice(split + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function cosine(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb));
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function sourceOrigin(family) {
  return family === "A" || family === "C1" ? "historical" : "modern";
}

const [modernText, historicalText, envText] = await Promise.all([
  readFile(modernPath, "utf8"),
  readFile(historicalPath, "utf8"),
  readFile(new URL("../.env.local", import.meta.url), "utf8"),
]);

const modernDoc = JSON.parse(modernText);
const historical = JSON.parse(historicalText);
const env = parseEnv(envText);
const apiKey = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY was not found in the environment or .env.local");
}

const modern = modernDoc.questions;
const inputs = [...modern.map((q) => q.text), ...historical.map((q) => q.text)];
// A deliberately high preflight estimate. English is commonly nearer 4 chars/token.
const estimatedTokens = Math.ceil(
  inputs.reduce((sum, input) => sum + input.length, 0) / 3,
);
const estimatedUsd =
  (estimatedTokens / 1_000_000) * ESTIMATED_USD_PER_MILLION_TOKENS;

if (!Number.isFinite(MAX_USD) || MAX_USD <= 0) {
  throw new Error("MAX_EMBEDDING_USD must be a positive number");
}
if (estimatedUsd > MAX_USD) {
  throw new Error(
    `Preflight estimate $${estimatedUsd.toFixed(6)} exceeds cap $${MAX_USD.toFixed(2)}`,
  );
}

console.log(
  `Embedding ${inputs.length} questions with ${MODEL}; preflight ${estimatedTokens} tokens, estimated $${estimatedUsd.toFixed(6)}, cap $${MAX_USD.toFixed(2)}.`,
);

const response = await fetch("https://api.openai.com/v1/embeddings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    input: inputs,
    encoding_format: "float",
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`OpenAI embeddings request failed (${response.status}): ${body}`);
}

const payload = await response.json();
if (!Array.isArray(payload.data) || payload.data.length !== inputs.length) {
  throw new Error("OpenAI returned an unexpected number of embeddings");
}

const vectors = [...payload.data]
  .sort((a, b) => a.index - b.index)
  .map((item) => item.embedding);
const modernVectors = vectors.slice(0, modern.length);
const historicalVectors = vectors.slice(modern.length);

const matrix = modern.map((modernQuestion, modernIndex) =>
  historical.map((historicalQuestion, historicalIndex) => ({
    modern_id: modernQuestion.id,
    period_question_id: historicalQuestion.n,
    score: cosine(modernVectors[modernIndex], historicalVectors[historicalIndex]),
  })),
);

const historicalRanks = new Map();
for (let historicalIndex = 0; historicalIndex < historical.length; historicalIndex += 1) {
  const ranked = modern
    .map((q, modernIndex) => ({
      modern_id: q.id,
      score: matrix[modernIndex][historicalIndex].score,
    }))
    .sort((a, b) => b.score - a.score);
  ranked.forEach((pair, index) => {
    historicalRanks.set(
      `${pair.modern_id}:${historical[historicalIndex].n}`,
      index + 1,
    );
  });
}

const modernCandidates = modern.map((modernQuestion, modernIndex) => {
  const ranked = [...matrix[modernIndex]].sort((a, b) => b.score - a.score);
  return {
    modern_id: modernQuestion.id,
    modern_text: modernQuestion.text,
    candidates: ranked.slice(0, TOP_K).map((pair, index) => {
      const period = historical.find((q) => q.n === pair.period_question_id);
      return {
        period_question_id: pair.period_question_id,
        period_text: period.text,
        period_family: period.family,
        period_source_origin: sourceOrigin(period.family),
        period_register: "period",
        cosine_similarity: round(pair.score),
        modern_to_period_rank: index + 1,
        period_to_modern_rank: historicalRanks.get(
          `${modernQuestion.id}:${pair.period_question_id}`,
        ),
      };
    }),
  };
});

const historicalCoverage = historical.map((period, historicalIndex) => {
  const ranked = modern
    .map((question, modernIndex) => ({
      modern_id: question.id,
      modern_text: question.text,
      score: matrix[modernIndex][historicalIndex].score,
    }))
    .sort((a, b) => b.score - a.score);
  return {
    period_question_id: period.n,
    period_text: period.text,
    period_family: period.family,
    period_source_origin: sourceOrigin(period.family),
    best_modern_id: ranked[0].modern_id,
    best_modern_text: ranked[0].modern_text,
    cosine_similarity: round(ranked[0].score),
  };
});

const actualTokens = payload.usage?.total_tokens ?? payload.usage?.prompt_tokens ?? null;
const result = {
  run: {
    id: "lw-modern-bank-pairing-v1",
    run_at: new Date().toISOString(),
    provider: "OpenAI",
    model: payload.model ?? MODEL,
    dimensions: vectors[0]?.length ?? null,
    input_count: inputs.length,
    input_sha256: sha256(JSON.stringify(inputs)),
    preprocessing: "Exact displayed question text; no template, stemming, or neutral gloss.",
    similarity: "cosine",
    top_k: TOP_K,
    max_usd: MAX_USD,
    conservative_preflight_tokens: estimatedTokens,
    conservative_preflight_usd: round(estimatedUsd, 8),
    actual_input_tokens: actualTokens,
    estimated_actual_usd: actualTokens
      ? round(
          (actualTokens / 1_000_000) * ESTIMATED_USD_PER_MILLION_TOKENS,
          8,
        )
      : null,
    price_assumption_usd_per_million_tokens: ESTIMATED_USD_PER_MILLION_TOKENS,
    note: "Scores retrieve candidates; they do not establish conceptual equivalence. Historical coverage keeps all 100 period-register questions in the map."
  },
  modern_candidates: modernCandidates,
  historical_coverage: historicalCoverage,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(
  `Wrote ${outputPath.pathname}; API reported ${actualTokens ?? "unknown"} input tokens.`,
);
