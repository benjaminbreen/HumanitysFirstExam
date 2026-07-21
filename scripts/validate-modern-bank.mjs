#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const modern = JSON.parse(
  await readFile(new URL("research/modern-bank-pilot/modern_questions.json", root)),
);
const candidates = JSON.parse(
  await readFile(
    new URL("research/modern-bank-pilot/pairing_candidates.json", root),
  ),
);
const judgments = JSON.parse(
  await readFile(
    new URL("research/modern-bank-pilot/judged_relationships.json", root),
  ),
);
const historical = JSON.parse(
  await readFile(new URL("src/data/question_bank.json", root)),
);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourceById = new Map(modern.sources.map((source) => [source.id, source]));
assert(sourceById.size === modern.sources.length, "Duplicate source ID");

const sourceTexts = new Map();
for (const source of modern.sources) {
  const text = await readFile(new URL(source.local_file, root), "utf8");
  assert(
    sha256(text) === source.text_sha256,
    `${source.id} checksum does not match ${source.local_file}`,
  );
  sourceTexts.set(source.id, text);
}

const questionIds = new Set();
const perSource = new Map();
for (const question of modern.questions) {
  assert(!questionIds.has(question.id), `Duplicate question ID ${question.id}`);
  questionIds.add(question.id);
  assert(question.text.endsWith("?"), `${question.id} is not phrased as a question`);
  const questionSourceIds = new Set();
  for (const evidence of question.evidence) {
    assert(sourceById.has(evidence.source_id), `${question.id} has unknown source`);
    assert(
      sourceTexts.get(evidence.source_id).includes(evidence.quote),
      `${question.id} evidence is not an exact source substring`,
    );
    questionSourceIds.add(evidence.source_id);
  }
  for (const sourceId of questionSourceIds) {
    perSource.set(sourceId, (perSource.get(sourceId) ?? 0) + 1);
  }
}

for (const [sourceId, count] of perSource) {
  assert(count <= 2, `${sourceId} contributes ${count} questions; maximum is 2`);
}

assert(
  candidates.modern_candidates.length === modern.questions.length,
  "Candidate output does not cover every modern question",
);
assert(
  candidates.historical_coverage.length === historical.length,
  "Candidate output does not cover every period-register question",
);

const inputs = [
  ...modern.questions.map((question) => question.text),
  ...historical.map((question) => question.text),
];
assert(
  candidates.run.input_sha256 === sha256(JSON.stringify(inputs)),
  "Embedding input hash is stale; rerun scripts/embed-modern-bank.mjs",
);

const candidateModernIds = new Set(
  candidates.modern_candidates.map((row) => row.modern_id),
);
for (const questionId of questionIds) {
  assert(candidateModernIds.has(questionId), `No candidates for ${questionId}`);
}

assert(
  judgments.relations.length === modern.questions.length,
  "Judgments do not cover every modern question",
);
const judgmentIds = new Set(judgments.relations.map((row) => row.modern_id));
for (const questionId of questionIds) {
  assert(judgmentIds.has(questionId), `No judgment for ${questionId}`);
}

console.log(
  `Validated ${modern.sources.length} sources, ${modern.questions.length} modern questions, ${historical.length} period-register questions, and ${judgments.relations.length} relationship judgments.`,
);
