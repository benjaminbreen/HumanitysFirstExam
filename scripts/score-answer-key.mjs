import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const responseArg = process.argv.find((argument) => argument.startsWith("--responses="));
const keyArg = process.argv.find((argument) => argument.startsWith("--key="));

if (!responseArg) {
  console.error("usage: node scripts/score-answer-key.mjs --responses=<coded-responses.json> [--key=<answer-key.json>]");
  process.exit(2);
}

const responsesPath = resolve(repoRoot, responseArg.slice("--responses=".length));
const keyPath = keyArg
  ? resolve(repoRoot, keyArg.slice("--key=".length))
  : join(repoRoot, "src", "data", "q33_answer_key.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function coverage(rows, positionCount) {
  const covered = unique(
    rows
      .filter((row) => row.commitment === "committed" && row.matchType === "key-position")
      .map((row) => row.positionId),
  );
  return { coveredPositionIds: covered.sort(), coverage: round(covered.length / positionCount) };
}

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function stringSeed(value) {
  let seed = 2166136261;
  for (const character of value) {
    seed ^= character.codePointAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function quantile(sorted, probability) {
  const index = Math.floor((sorted.length - 1) * probability);
  return sorted[index];
}

function bootstrapInterval(rows, positionCount, seedLabel, iterations = 2000) {
  const random = makeRandom(stringSeed(seedLabel));
  const estimates = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sample = [];
    for (let index = 0; index < rows.length; index += 1) {
      sample.push(rows[Math.floor(random() * rows.length)]);
    }
    estimates.push(coverage(sample, positionCount).coverage);
  }
  estimates.sort((left, right) => left - right);
  return [quantile(estimates, 0.025), quantile(estimates, 0.975)];
}

const key = readJson(keyPath);
const coded = readJson(responsesPath);
const positions = new Map(key.positions.map((position) => [position.id, position]));
const allowedCommitments = new Set(["committed", "uncommitted", "non-answer"]);
const allowedMatchTypes = new Set(["key-position", "out-of-key", "none"]);

assert(coded.questionN === key.question.n, "response question number does not match the answer key");
assert(coded.keyVersion === key.meta.keyVersion, "response labels use a different answer-key version");
assert(typeof coded.status === "string" && coded.status.length > 0, "response dataset status label is required");
assert(Array.isArray(coded.responses) && coded.responses.length > 0, "response dataset is empty");
assert(unique(coded.responses.map((row) => row.id)).length === coded.responses.length, "duplicate response id");

for (const row of coded.responses) {
  assert(typeof row.respondentClass === "string" && row.respondentClass.length > 0, `${row.id}: respondent class required`);
  assert(Number.isInteger(row.drawIndex) && row.drawIndex > 0, `${row.id}: positive draw index required`);
  assert(allowedCommitments.has(row.commitment), `${row.id}: invalid commitment`);
  assert(allowedMatchTypes.has(row.matchType), `${row.id}: invalid match type`);

  if (row.matchType === "key-position") {
    assert(row.commitment === "committed", `${row.id}: only a committed response can occupy a position`);
    const position = positions.get(row.positionId);
    assert(position, `${row.id}: unknown key position`);
    assert(row.verdict === position.verdict, `${row.id}: coded verdict disagrees with position`);
    assert(row.primaryGroundId === position.primaryGroundId, `${row.id}: coded ground disagrees with position`);
  } else {
    assert(row.positionId === null, `${row.id}: non-key match cannot name a key position`);
  }

  if (row.matchType === "out-of-key") {
    assert(row.commitment === "committed", `${row.id}: out-of-key positions must still be occupied, not mentioned`);
    assert(["frees", "binds"].includes(row.verdict), `${row.id}: out-of-key verdict required`);
    assert(typeof row.primaryGroundId === "string" && row.primaryGroundId.length > 0, `${row.id}: out-of-key ground required`);
  }

  if (row.matchType === "none") {
    assert(row.positionId === null, `${row.id}: no-match row cannot name a position`);
    assert(row.verdict === null, `${row.id}: no-match row cannot supply a verdict`);
    assert(row.primaryGroundId === null, `${row.id}: no-match row cannot supply a ground`);
  }
}

const classes = unique(coded.responses.map((row) => row.respondentClass)).sort();
const results = classes.map((respondentClass) => {
  const rows = coded.responses
    .filter((row) => row.respondentClass === respondentClass)
    .sort((left, right) => left.drawIndex - right.drawIndex);
  assert(unique(rows.map((row) => row.drawIndex)).length === rows.length, `${respondentClass}: duplicate draw index`);
  const observed = coverage(rows, key.positions.length);
  const coverageAt = Object.fromEntries(
    [1, 5, 10, 20]
      .filter((count) => count <= rows.length)
      .map((count) => [count, coverage(rows.slice(0, count), key.positions.length).coverage]),
  );
  const committedCount = rows.filter((row) => row.commitment === "committed").length;
  const outOfKeyCount = rows.filter((row) => row.matchType === "out-of-key").length;
  return {
    respondentClass,
    draws: rows.length,
    eligiblePositionCount: key.positions.length,
    coveredPositionIds: observed.coveredPositionIds,
    coverageAtObservedN: observed.coverage,
    coverageAt,
    bootstrap95AtObservedN: bootstrapInterval(
      rows,
      key.positions.length,
      `${coded.keyVersion}:${respondentClass}:${rows.length}`,
    ),
    committedCount,
    commitmentRate: round(committedCount / rows.length),
    outOfKeyCount,
    outOfKeyRate: round(outOfKeyCount / rows.length),
  };
});

console.log(JSON.stringify({
  status: coded.status,
  questionN: coded.questionN,
  keyVersion: coded.keyVersion,
  scoringRule: key.scoringRule.primaryMetric,
  results,
}, null, 2));
