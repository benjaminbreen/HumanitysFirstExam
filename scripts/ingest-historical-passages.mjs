import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const researchPath = join(repoRoot, "research", "multilingual-long-tail-passages.json");
const manifestPath = join(repoRoot, "research", "historical-source-manifest.json");
const codebookPath = join(repoRoot, "src", "data", "codebook.json");
const questionBankPath = join(repoRoot, "src", "data", "question_bank.json");
const outputPath = join(repoRoot, "src", "data", "historical_passages.json");
const localSourceDir = join(repoRoot, "data-local", "historical-sources");
const checkOnly = process.argv.includes("--check");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

function localSourceFor(passage) {
  const extension = passage.sourceVerificationLevel === "scan-checked" ? ".pdf" : ".txt";
  const path = join(localSourceDir, `${passage.sourceId}${extension}`);
  assert(existsSync(path), `${passage.id}: missing local source ${relative(repoRoot, path)}`);
  return path;
}

const research = readJson(researchPath);
const manifest = readJson(manifestPath);
const codebook = readJson(codebookPath);
const questionBank = readJson(questionBankPath);
const sourceById = new Map(manifest.map((source) => [source.id, source]));
const codeIds = new Set(codebook.flatMap((branch) => branch.leaves.map((leaf) => leaf.id)));
const questionNumbers = new Set(questionBank.map((question) => question.n));
const verificationLevels = new Set([
  "repository-text-checked",
  "scan-checked",
  "transcription-checked",
  "transcription-checked-scan-pending",
]);
const translationStatuses = new Set(["not-needed", "required", "reviewed"]);
const transmissionTypes = new Set([
  "no-known-direct-dependency",
  "explicit-response",
  "literary-form-only",
  "inherited-form",
]);
const convergenceStatuses = new Set([
  "candidate",
  "candidate-with-inherited-form",
  "exclude-explicit-response",
]);

assert(research.status === "pilot", "research ledger must remain explicitly labeled as a pilot");
assert(Array.isArray(research.passages) && research.passages.length > 0, "no passages to ingest");
assert(
  unique(research.passages.map((passage) => passage.id)).length === research.passages.length,
  "duplicate passage id in research ledger",
);

const passages = research.passages.map((passage) => {
  const source = sourceById.get(passage.sourceId);
  assert(source, `${passage.id}: sourceId is absent from the historical source manifest`);
  assert(
    ["long_tail_pilot", "jamesiana_discovery"].includes(source.tier),
    `${passage.id}: source tier is not admitted to the historical passage dataset`,
  );
  assert(passage.year >= 1850 && passage.year <= 1940, `${passage.id}: year is outside the historical period`);
  assert(source.year === passage.year, `${passage.id}: year disagrees with the source manifest`);
  assert(source.title === passage.title, `${passage.id}: title disagrees with the source manifest`);
  assert(source.language === passage.language, `${passage.id}: language disagrees with the source manifest`);
  assert(typeof passage.genre === "string" && passage.genre.length > 0, `${passage.id}: genre is required`);
  assert(typeof passage.original === "string" && passage.original.length > 40, `${passage.id}: original passage is missing`);
  assert(typeof passage.locator === "string" && passage.locator.length > 0, `${passage.id}: locator is required`);
  assert(typeof passage.proposedQuestion === "string" && passage.proposedQuestion.length > 0, `${passage.id}: question seed is required`);
  assert(verificationLevels.has(passage.sourceVerificationLevel), `${passage.id}: unknown source verification level`);
  assert(translationStatuses.has(passage.translationReviewStatus), `${passage.id}: unknown translation review status`);
  assert(transmissionTypes.has(passage.transmissionType), `${passage.id}: unknown transmission type`);
  assert(convergenceStatuses.has(passage.independentConvergenceStatus), `${passage.id}: unknown convergence status`);
  assert(
    (passage.workingTranslation === null) === (passage.translationReviewStatus === "not-needed"),
    `${passage.id}: translation text and review status disagree`,
  );
  for (const code of passage.codebookLeafIds) {
    assert(codeIds.has(code), `${passage.id}: unknown codebook leaf ${code}`);
  }
  for (const number of passage.nathanQuestionNumbers) {
    assert(questionNumbers.has(number), `${passage.id}: unknown question-bank number ${number}`);
  }

  const localPath = localSourceFor(passage);
  const bytes = readFileSync(localPath);

  return {
    id: passage.id,
    sourceId: passage.sourceId,
    author: passage.author,
    title: passage.title,
    year: passage.year,
    language: passage.language,
    region: passage.region,
    genre: passage.genre,
    locator: passage.locator,
    originalText: passage.original,
    englishText: passage.workingTranslation,
    questionSeed: passage.proposedQuestion,
    relatedQuestionNumbers: passage.nathanQuestionNumbers,
    codes: passage.codebookLeafIds,
    codebookGap: passage.codebookGap,
    source: {
      url: passage.sourceUrl,
      localFile: relative(repoRoot, localPath),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      verificationLevel: passage.sourceVerificationLevel,
      note: passage.sourceStatus,
    },
    translation: {
      reviewStatus: passage.translationReviewStatus,
      note: passage.translationStatus,
    },
    provenance: {
      relationship: passage.provenanceRelationship,
      transmissionType: passage.transmissionType,
      independentConvergenceStatus: passage.independentConvergenceStatus,
    },
  };
}).sort((left, right) => left.year - right.year || left.id.localeCompare(right.id));

const dataset = {
  meta: {
    version: "historical-pilot-0.1",
    status: "real-pilot",
    scope: research.scope,
    period: { start: 1850, end: 1940 },
    passageCount: passages.length,
    sourceCount: unique(passages.map((passage) => passage.sourceId)).length,
    languageCount: unique(passages.map((passage) => passage.language)).length,
    sourceCheckedCount: passages.length,
    originalScanPendingCount: passages.filter(
      (passage) => passage.source.verificationLevel === "transcription-checked-scan-pending",
    ).length,
    translationReviewRequiredCount: passages.filter(
      (passage) => passage.translation.reviewStatus === "required",
    ).length,
    independentConvergenceCandidateCount: passages.filter(
      (passage) => passage.provenance.independentConvergenceStatus === "candidate",
    ).length,
    note: "The source text and locator were checked for every admitted passage. Working English translations remain provisional until reviewed by a reader of the source language. Explicit reception is retained but excluded from independent-convergence counts.",
    generatedFrom: [
      relative(repoRoot, researchPath),
      relative(repoRoot, manifestPath),
      relative(repoRoot, codebookPath),
      relative(repoRoot, questionBankPath),
    ],
  },
  passages,
};

const serialized = `${JSON.stringify(dataset, null, 2)}\n`;

if (checkOnly) {
  assert(existsSync(outputPath), `generated dataset is missing: ${relative(repoRoot, outputPath)}`);
  assert(readFileSync(outputPath, "utf8") === serialized, "generated historical passage dataset is stale");
  console.log(`historical passage dataset is current (${passages.length} passages)`);
} else {
  writeFileSync(outputPath, serialized);
  console.log(`ingested ${passages.length} passages into ${relative(repoRoot, outputPath)}`);
}
