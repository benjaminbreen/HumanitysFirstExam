import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourcePath = join(repoRoot, "research", "answer-key-prototype", "q33.json");
const manifestPath = join(repoRoot, "research", "historical-source-manifest.json");
const historicalPassagesPath = join(repoRoot, "src", "data", "historical_passages.json");
const questionBankPath = join(repoRoot, "src", "data", "question_bank.json");
const codebookPath = join(repoRoot, "src", "data", "codebook.json");
const outputPath = join(repoRoot, "src", "data", "q33_answer_key.json");
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

function hashFile(path) {
  const bytes = readFileSync(path);
  return {
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function normalizeForMatch(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertExcerptPresent(attestation, localPath) {
  const source = normalizeForMatch(readFileSync(localPath, "utf8"));
  const spans = attestation.originalText
    .split(/\s*\[\.\.\.\]\s*/)
    .map(normalizeForMatch)
    .filter((span) => span.length >= 30);
  assert(spans.length > 0, `${attestation.id}: no excerpt span is long enough to check`);
  for (const span of spans) {
    assert(source.includes(span), `${attestation.id}: excerpt span not found in ${attestation.localFile}`);
  }
}

const source = readJson(sourcePath);
const manifest = readJson(manifestPath);
const historicalDataset = readJson(historicalPassagesPath);
const questionBank = readJson(questionBankPath);
const codebook = readJson(codebookPath);
const sourceById = new Map(manifest.map((entry) => [entry.id, entry]));
const historicalById = new Map(historicalDataset.passages.map((passage) => [passage.id, passage]));
const codeIds = new Set(codebook.flatMap((branch) => branch.leaves.map((leaf) => leaf.id)));
const question = questionBank.find((entry) => entry.n === source.questionN);
const positionById = new Map(source.positions.map((position) => [position.id, position]));

assert(source.status === "prototype-draft-for-human-review", "prototype status label is required");
assert(question, `question ${source.questionN} is absent from the bank`);
assert(source.questionN === 33, "this prototype ingester currently admits Q33 only");
assert(source.positions.length > 0, "answer key has no positions");
assert(source.candidateAttestations.length > 0, "answer key has no candidate attestations");
assert(unique(source.positions.map((position) => position.id)).length === source.positions.length, "duplicate position id");
assert(
  unique(source.candidateAttestations.map((attestation) => attestation.id)).length === source.candidateAttestations.length,
  "duplicate attestation id",
);

for (const position of source.positions) {
  assert(["frees", "binds"].includes(position.verdict), `${position.id}: invalid verdict`);
  assert(codeIds.has(position.primaryGroundId), `${position.id}: invalid codebook ground`);
  assert(["direct", "partial"].includes(position.groundFit), `${position.id}: invalid ground fit`);
  assert(["repeated", "singleton", "contested"].includes(position.evidenceStatus), `${position.id}: invalid evidence status`);
  assert(position.attestationIds.length > 0, `${position.id}: position has no evidence`);
}

const resolvedAttestations = source.candidateAttestations.map((attestation) => {
  assert(["admitted", "excluded"].includes(attestation.decision), `${attestation.id}: invalid decision`);
  assert(["direct", "near", "rejected"].includes(attestation.fit), `${attestation.id}: invalid fit`);
  assert(typeof attestation.codingRationale === "string" && attestation.codingRationale.length > 20, `${attestation.id}: coding rationale required`);

  if (attestation.decision === "admitted") {
    assert(attestation.fit === "direct", `${attestation.id}: admitted evidence must directly answer the question`);
    assert(positionById.has(attestation.positionId), `${attestation.id}: invalid position`);
    assert(codeIds.has(attestation.primaryGroundId), `${attestation.id}: invalid codebook ground`);
    const position = positionById.get(attestation.positionId);
    assert(attestation.verdict === position.verdict, `${attestation.id}: verdict disagrees with position`);
    assert(attestation.primaryGroundId === position.primaryGroundId, `${attestation.id}: ground disagrees with position`);
  } else {
    assert(attestation.positionId === null, `${attestation.id}: excluded evidence cannot map to a position`);
    assert(attestation.verdict === null, `${attestation.id}: excluded evidence cannot supply a verdict`);
    assert(attestation.primaryGroundId === null, `${attestation.id}: excluded evidence cannot supply a ground`);
  }

  if (attestation.sourceKind === "historical-passage") {
    const passage = historicalById.get(attestation.historicalPassageId);
    assert(passage, `${attestation.id}: unknown historical passage ${attestation.historicalPassageId}`);
    assert(passage.relatedQuestionNumbers.includes(source.questionN), `${attestation.id}: passage was not retrieved for Q33`);
    const localPath = join(repoRoot, passage.source.localFile);
    assert(existsSync(localPath), `${attestation.id}: local source file is missing`);
    const currentHash = hashFile(localPath);
    assert(currentHash.sha256 === passage.source.sha256, `${attestation.id}: historical source checksum changed`);
    return {
      ...attestation,
      passageId: passage.id,
      sourceId: passage.sourceId,
      author: passage.author,
      title: passage.title,
      year: passage.year,
      language: passage.language,
      region: passage.region,
      genre: passage.genre,
      locator: passage.locator,
      originalText: passage.originalText,
      englishText: passage.englishText,
      textStatus: passage.translation.reviewStatus === "required"
        ? "working-translation-review-required"
        : "original-English",
      sourceUrl: passage.source.url,
      localFile: passage.source.localFile,
      sourceStatus: passage.source.note,
      sourceVerificationLevel: passage.source.verificationLevel,
      translationStatus: passage.translation.note,
      sourceSha256: currentHash.sha256,
      sourceBytes: currentHash.bytes,
      provenanceRelationship: passage.provenance.relationship,
    };
  }

  assert(attestation.sourceKind === "local-excerpt", `${attestation.id}: invalid source kind`);
  const manifestEntry = sourceById.get(attestation.sourceId);
  assert(manifestEntry, `${attestation.id}: source absent from manifest`);
  assert(manifestEntry.author === attestation.author, `${attestation.id}: author disagrees with manifest`);
  assert(manifestEntry.title === attestation.title, `${attestation.id}: title disagrees with manifest`);
  assert(manifestEntry.year === attestation.year, `${attestation.id}: year disagrees with manifest`);
  assert(attestation.year >= 1860 && attestation.year <= 1930, `${attestation.id}: outside instrument window`);
  const localPath = join(repoRoot, attestation.localFile);
  assert(existsSync(localPath), `${attestation.id}: local source file is missing`);
  assertExcerptPresent(attestation, localPath);
  return {
    ...attestation,
    sourceVerificationLevel: "local-text-checked",
    translationStatus: attestation.textStatus === "published-English-translation"
      ? "published English translation used as the cited edition"
      : "original is English",
    ...Object.fromEntries(Object.entries(hashFile(localPath)).map(([key, value]) => [
      key === "sha256" ? "sourceSha256" : "sourceBytes",
      value,
    ])),
    provenanceRelationship: manifestEntry.provenanceRelationship ?? "No direct dependency identified in this pass.",
  };
});

const attestationById = new Map(resolvedAttestations.map((attestation) => [attestation.id, attestation]));
const resolvedPositions = source.positions.map((position) => {
  for (const attestationId of position.attestationIds) {
    const attestation = attestationById.get(attestationId);
    assert(attestation, `${position.id}: unknown attestation ${attestationId}`);
    assert(attestation.decision === "admitted", `${position.id}: excluded evidence cannot support a position`);
    assert(attestation.positionId === position.id, `${position.id}: attestation points to another position`);
  }
  const linked = resolvedAttestations.filter((attestation) => attestation.positionId === position.id);
  assert(linked.length === position.attestationIds.length, `${position.id}: position evidence list is incomplete`);
  const sourceTraditionCount = unique(linked.map((attestation) => attestation.independenceGroup)).length;
  const expectedStatus = sourceTraditionCount >= 2 ? "repeated" : "singleton";
  if (position.evidenceStatus !== "contested") {
    assert(position.evidenceStatus === expectedStatus, `${position.id}: evidence status disagrees with source count`);
  }
  return { ...position, sourceTraditionCount };
});

const admitted = resolvedAttestations.filter((attestation) => attestation.decision === "admitted");
const dataset = {
  meta: {
    keyVersion: source.keyVersion,
    status: source.status,
    benchmarkReady: false,
    codingStatus: source.codingStatus,
    methodNote: source.methodNote,
    candidateAttestationCount: resolvedAttestations.length,
    admittedAttestationCount: admitted.length,
    excludedAttestationCount: resolvedAttestations.length - admitted.length,
    positionCount: resolvedPositions.length,
    sourceTraditionCount: unique(admitted.map((attestation) => attestation.independenceGroup)).length,
    repeatedPositionCount: resolvedPositions.filter((position) => position.evidenceStatus === "repeated").length,
    singletonPositionCount: resolvedPositions.filter((position) => position.evidenceStatus === "singleton").length,
    workingTranslationCount: admitted.filter((attestation) => attestation.textStatus === "working-translation-review-required").length,
    generatedFrom: [
      relative(repoRoot, sourcePath),
      relative(repoRoot, manifestPath),
      relative(repoRoot, historicalPassagesPath),
      relative(repoRoot, questionBankPath),
      relative(repoRoot, codebookPath),
    ],
  },
  question: {
    n: question.n,
    family: question.family,
    axis: question.axis,
    band: question.band,
    text: question.text,
  },
  scoringRule: {
    primaryMetric: "coverage@N = distinct eligible positions occupied by committed responses / all eligible answer-key positions",
    occupyingRule: "A response counts only when it commits to the position's verdict and uses its primary ground. Mentioning or listing a position does not count.",
    weighting: "Every position has equal weight. Attestation count is evidence metadata, not a prevalence weight.",
    additionalMetrics: ["coverage@1/5/10/20", "commitment rate", "out-of-key rate", "bootstrap 95% interval"],
  },
  positions: resolvedPositions,
  candidateAttestations: resolvedAttestations,
};

const serialized = `${JSON.stringify(dataset, null, 2)}\n`;
if (checkOnly) {
  assert(existsSync(outputPath), `generated dataset is missing: ${relative(repoRoot, outputPath)}`);
  assert(readFileSync(outputPath, "utf8") === serialized, "generated Q33 answer-key dataset is stale");
  console.log(`Q33 answer-key dataset is current (${resolvedPositions.length} positions, ${admitted.length} admitted attestations)`);
} else {
  writeFileSync(outputPath, serialized);
  console.log(`ingested Q33 answer key into ${relative(repoRoot, outputPath)}`);
}
