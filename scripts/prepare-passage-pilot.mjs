#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourceIndexPath = join(repoRoot, "src", "data", "historical_source_texts.json");
const passagesPath = join(repoRoot, "src", "data", "historical_passages.json");
const questionsPath = join(repoRoot, "src", "data", "question_bank.json");
const schemaPath = join(repoRoot, "src", "data", "classification_schema.json");
const codebookPath = join(repoRoot, "src", "data", "codebook.json");
const goldPath = join(repoRoot, "data-local", "review", "gold-classifications.json");
const promptPath = join(repoRoot, "prompts", "classify-passages-from-gold.md");
const localOutputDirectory = join(repoRoot, "data-local", "review");
const chunkOutputPath = join(localOutputDirectory, "passage-pilot-chunks.jsonl");
const outputPath = join(repoRoot, "research", "passage-pilot-preflight.json");

const targetCount = Number(process.env.PASSAGE_PILOT_LIMIT ?? "20");
const chunkWords = 425;
const overlapWords = 70;
const minimumWords = 250;
const instrumentStart = 1850;
const instrumentEnd = 1940;

// A local reading pass corrected seven lexical false positives. These are
// context windows for the paid relevance check, not admitted passages.
const preferredPilotChunks = new Map([
  ["control-lippmann-public-opinion-1922", "control-lippmann-public-opinion-1922:w78100-78525"],
  ["control-wells-world-set-free-1914", "control-wells-world-set-free-1914:w48635-49060"],
  ["control-james-principles-v1-1890", "control-james-principles-v1-1890:w46860-47285"],
  ["control-taylor-scientific-management-1911", "control-taylor-scientific-management-1911:w8165-8590"],
  ["longtail-bose-response-1902", "longtail-bose-response-1902:w41890-42315"],
  ["control-james-will-believe-1897", "control-james-will-believe-1897:w46860-47285"],
  ["control-russell-free-mans-worship-1903", "control-russell-free-mans-worship-1903:w66030-66455"],
]);

const stopWords = new Set(
  `a an and are as at be been being but by can could did do does doing for from
  had has have he her hers him his how i if in into is it its may might more most
  must no nor not of on one only or other our ours should so some such than that
  the their them then there these they this those through to under up upon was we
  were what when where whether which who whose why will with would you your man
  men thing things itself own already ever every any`.split(/\s+/),
);

const boilerplatePhrases = [
  "project gutenberg",
  "google book search",
  "usage guidelines",
  "terms of use",
  "transcriber note",
  "table of contents",
  "all rights reserved",
  "wikisource",
  "create account",
  "privacy policy",
  "navigation menu",
  "main menu",
  "download this ebook",
];

function approximateTokens(value) {
  // Conservative planning estimate for mixed prose and JSON instructions.
  return Math.ceil(value.length / 3);
}

function normalizeText(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function stripRepositoryBoilerplate(value) {
  let text = normalizeText(value);
  const start = text.search(/\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG/iu);
  if (start >= 0) {
    const nextLine = text.indexOf("\n", start);
    text = text.slice(nextLine >= 0 ? nextLine + 1 : start);
  }
  const end = text.search(/\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG/iu);
  if (end >= 0) text = text.slice(0, end);
  return text.trim();
}

function wordsWithOffsets(text) {
  return [...text.matchAll(/\S+/gu)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    value: match[0],
  }));
}

function findHeading(text, charOffset) {
  const before = text.slice(Math.max(0, charOffset - 1600), charOffset);
  const lines = before
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-18)
    .reverse();
  for (const line of lines) {
    if (line.length < 3 || line.length > 100) continue;
    if (/^(chapter|book|part|section|essay|lecture|act|scene)\b/iu.test(line)) {
      return line.replace(/\s+/g, " ");
    }
    const letters = [...line].filter((character) => /\p{L}/u.test(character));
    const uppercase = letters.filter(
      (character) => character === character.toUpperCase(),
    );
    if (letters.length >= 4 && uppercase.length / letters.length > 0.82) {
      return line.replace(/\s+/g, " ");
    }
  }
  return null;
}

function tokenize(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((word) => word.length > 2 && !stopWords.has(word)) ?? [];
}

function frequencies(words) {
  const result = new Map();
  for (const word of words) result.set(word, (result.get(word) ?? 0) + 1);
  return result;
}

function qualityPenalty(text) {
  const lower = text.toLowerCase();
  let penalty = 0;
  for (const phrase of boilerplatePhrases) {
    if (lower.includes(phrase)) penalty += 12;
  }
  const lines = text.split("\n").filter(Boolean);
  const veryShortLines = lines.filter((line) => line.trim().length < 35).length;
  if (lines.length > 10 && veryShortLines / lines.length > 0.7) penalty += 8;
  if ((text.match(/https?:\/\//g) ?? []).length > 2) penalty += 10;
  return penalty;
}

function makeChunks(source, text) {
  const words = wordsWithOffsets(text);
  const chunks = [];
  const step = chunkWords - overlapWords;
  for (let startWord = 0; startWord < words.length; startWord += step) {
    const endWord = Math.min(startWord + chunkWords, words.length);
    if (endWord - startWord < minimumWords) break;
    const charStart = words[startWord].start;
    const charEnd = words[endWord - 1].end;
    const passageText = text.slice(charStart, charEnd).trim();
    const heading = findHeading(text, charStart);
    chunks.push({
      chunkId: `${source.sourceId}:w${startWord}-${endWord}`,
      sourceId: source.sourceId,
      author: source.author,
      title: source.title,
      year: source.year,
      language: source.language,
      sourceUrl: source.sourceUrl,
      linkedQuestionNumbers: source.questions,
      subjectAxes: source.subjects,
      heading,
      provisionalLocator: heading
        ? `${heading}; local word range ${startWord + 1}–${endWord}`
        : `Local word range ${startWord + 1}–${endWord}`,
      wordStart: startWord,
      wordEnd: endWord,
      wordCount: endWord - startWord,
      text: passageText,
      qualityPenalty: qualityPenalty(passageText),
    });
  }
  return chunks;
}

function queryForSource(source, questionByNumber, classificationSchema) {
  const questions = source.questions
    .map((number) => questionByNumber.get(number)?.text)
    .filter(Boolean);
  const schemaTerms = classificationSchema.themes.flatMap((theme) => [
    theme.label,
    theme.definition,
    ...theme.children.flatMap((child) => [child.label, child.definition]),
  ]);
  return [
    source.relevance,
    ...questions,
    ...source.subjects,
    ...schemaTerms,
    "machine machinery mechanism mechanical automaton engine technology tool",
    "will freedom choice agency autonomy dependence command control responsibility",
    "labour work skill government surveillance crowd public opinion progress decline",
  ].join(" ");
}

function scoreChunks(chunks, sourceQueries) {
  const queryTerms = new Set(
    [...sourceQueries.values()].flatMap((query) => tokenize(query)),
  );
  const documentFrequency = new Map();
  const chunkFrequencies = new Map();

  for (const chunk of chunks) {
    const counts = frequencies(tokenize(chunk.text));
    chunkFrequencies.set(chunk.chunkId, counts);
    for (const term of counts.keys()) {
      if (queryTerms.has(term)) {
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      }
    }
  }

  return chunks.map((chunk) => {
    const counts = chunkFrequencies.get(chunk.chunkId);
    const queryCounts = frequencies(tokenize(sourceQueries.get(chunk.sourceId) ?? ""));
    let score = 0;
    for (const [term, queryFrequency] of queryCounts) {
      const count = counts.get(term) ?? 0;
      if (!count) continue;
      const idf = Math.log((chunks.length + 1) / ((documentFrequency.get(term) ?? 0) + 1)) + 1;
      score += (1 + Math.log(count)) * idf * Math.min(2, 1 + Math.log(queryFrequency));
    }
    score = score / Math.sqrt(chunk.wordCount) - chunk.qualityPenalty;
    return { ...chunk, localRetrievalScore: Number(score.toFixed(4)) };
  });
}

function choosePilot(scoredChunks, target) {
  const usable = scoredChunks
    .filter((chunk) => chunk.qualityPenalty === 0)
    .sort((a, b) => b.localRetrievalScore - a.localRetrievalScore);
  const selected = [];
  const usedSources = new Set();

  // One candidate per work keeps the first pilot legible and tests breadth.
  for (const chunk of usable) {
    if (usedSources.has(chunk.sourceId)) continue;
    selected.push(chunk);
    usedSources.add(chunk.sourceId);
    if (selected.length === target) break;
  }

  // Only needed if the eligible corpus has fewer works than the requested pilot.
  if (selected.length < target) {
    const usedChunks = new Set(selected.map((chunk) => chunk.chunkId));
    for (const chunk of usable) {
      if (usedChunks.has(chunk.chunkId)) continue;
      selected.push(chunk);
      if (selected.length === target) break;
    }
  }

  const chunkById = new Map(scoredChunks.map((chunk) => [chunk.chunkId, chunk]));
  const corrected = selected.map((chunk) => {
    const preferredId = preferredPilotChunks.get(chunk.sourceId);
    return preferredId ? (chunkById.get(preferredId) ?? chunk) : chunk;
  });

  return corrected.map((chunk, index) => ({
    candidateId: `pilot-${String(index + 1).padStart(2, "0")}`,
    status: "candidate-not-citation-verified",
    selectionMethod: preferredPilotChunks.has(chunk.sourceId)
      ? "local-reading-correction"
      : "local-lexical-preselection",
    ...chunk,
  }));
}

const [sourceIndexText, passagesText, questionsText, schemaText, codebookText, promptText, goldText] =
  await Promise.all([
    readFile(sourceIndexPath, "utf8"),
    readFile(passagesPath, "utf8"),
    readFile(questionsPath, "utf8"),
    readFile(schemaPath, "utf8"),
    readFile(codebookPath, "utf8"),
    readFile(promptPath, "utf8"),
    readFile(goldPath, "utf8").catch(() =>
      JSON.stringify({ schemaVersion: null, annotations: [] }),
    ),
  ]);

const sourceIndex = JSON.parse(sourceIndexText).sources;
const passages = JSON.parse(passagesText).passages;
const questions = JSON.parse(questionsText);
const classificationSchema = JSON.parse(schemaText);
const gold = JSON.parse(goldText);
const questionByNumber = new Map(questions.map((question) => [question.n, question]));
const admittedSourceIds = new Set(passages.map((passage) => passage.sourceId));
const eligibleSources = sourceIndex.filter(
  (source) =>
    !admittedSourceIds.has(source.sourceId) &&
    source.year >= instrumentStart &&
    source.year <= instrumentEnd,
);

const chunks = [];
const sourceQueries = new Map();
for (const source of eligibleSources) {
  const localTextPath = join(repoRoot, "public", source.textPath.replace(/^\//, ""));
  const text = stripRepositoryBoilerplate(await readFile(localTextPath, "utf8"));
  sourceQueries.set(source.sourceId, queryForSource(source, questionByNumber, classificationSchema));
  chunks.push(...makeChunks(source, text));
}

const scoredChunks = scoreChunks(chunks, sourceQueries);
const candidates = choosePilot(scoredChunks, targetCount);
const embeddingTokens = scoredChunks.reduce(
  (sum, chunk) => sum + approximateTokens(chunk.text),
  0,
);
const queryEmbeddingTokens = [...sourceQueries.values()].reduce(
  (sum, query) => sum + approximateTokens(query),
  0,
);

const goldExamples = gold.annotations.map((annotation) => ({
  passage: passages.find((passage) => passage.id === annotation.passageId),
  historianClassification: annotation,
}));
const fixedClassifierInput = [
  promptText,
  schemaText,
  codebookText,
  JSON.stringify(goldExamples),
].join("\n\n");
const classificationInputTokens = candidates.reduce(
  (sum, candidate) =>
    sum + approximateTokens(fixedClassifierInput + JSON.stringify(candidate)),
  0,
);
const estimatedOutputTokens = candidates.length * 350;

const rates = {
  embeddingPerMillion: 0.02,
  classifierStandardInputPerMillion: 1,
  classifierStandardOutputPerMillion: 6,
  classifierBatchInputPerMillion: 0.5,
  classifierBatchOutputPerMillion: 3,
};
const embeddingCost =
  ((embeddingTokens + queryEmbeddingTokens) / 1_000_000) * rates.embeddingPerMillion;
const standardClassificationCost =
  (classificationInputTokens / 1_000_000) * rates.classifierStandardInputPerMillion +
  (estimatedOutputTokens / 1_000_000) * rates.classifierStandardOutputPerMillion;
const batchClassificationCost =
  (classificationInputTokens / 1_000_000) * rates.classifierBatchInputPerMillion +
  (estimatedOutputTokens / 1_000_000) * rates.classifierBatchOutputPerMillion;

await mkdir(localOutputDirectory, { recursive: true });
await writeFile(
  chunkOutputPath,
  scoredChunks.map((chunk) => JSON.stringify(chunk)).join("\n") + "\n",
  "utf8",
);

const output = {
  meta: {
    status: "preflight-no-api-calls-made",
    preparedAt: new Date().toISOString(),
    instrumentPeriod: { start: instrumentStart, end: instrumentEnd },
    searchableWorkCount: sourceIndex.length,
    existingAdmittedPassageCount: passages.length,
    eligibleUnpassagedWorkCount: eligibleSources.length,
    excludedOutsidePeriodCount: sourceIndex.filter(
      (source) =>
        !admittedSourceIds.has(source.sourceId) &&
        (source.year < instrumentStart || source.year > instrumentEnd),
    ).length,
    chunkCount: scoredChunks.length,
    candidateCount: candidates.length,
    selectionRule:
      "One candidate per work, selected by local lexical search and a no-cost reading pass. Model retrieval and historian citation review have not run.",
    generatedFiles: [
      relative(repoRoot, chunkOutputPath),
      relative(repoRoot, outputPath),
    ],
  },
  costProjection: {
    currency: "USD",
    assumptions: [
      "Embed every eligible 425-word chunk and each work-specific query with text-embedding-3-small.",
      "Run one combined relevance-and-schema classification request for each of the 20 selected passages with gpt-5.6-luna.",
      "Include the full schema, codebook, prompt, and four historian examples in every classifier request; no prompt-cache discount is assumed.",
      "Allow 350 output tokens per passage. Actual billing will use API-reported token counts.",
      "Translation and manual citation verification are not priced as model calls in this pilot.",
    ],
    embedding: {
      model: "text-embedding-3-small",
      estimatedTokens: embeddingTokens + queryEmbeddingTokens,
      ratePerMillionTokens: rates.embeddingPerMillion,
      projectedCost: Number(embeddingCost.toFixed(6)),
    },
    classification: {
      model: "gpt-5.6-luna",
      requestCount: candidates.length,
      estimatedInputTokens: classificationInputTokens,
      estimatedOutputTokens,
      standardProjectedCost: Number(standardClassificationCost.toFixed(6)),
      batchOrFlexProjectedCost: Number(batchClassificationCost.toFixed(6)),
    },
    total: {
      standardProjectedCost: Number(
        (embeddingCost + standardClassificationCost).toFixed(6),
      ),
      batchOrFlexProjectedCost: Number(
        (embeddingCost + batchClassificationCost).toFixed(6),
      ),
    },
    pricingCheckedOn: "2026-07-21",
    pricingSources: [
      "https://developers.openai.com/api/docs/models/text-embedding-3-small",
      "https://developers.openai.com/api/docs/pricing",
    ],
  },
  candidates,
};

await writeFile(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

console.log(`Prepared ${candidates.length} provisional passages from ${eligibleSources.length} eligible unpassaged works.`);
console.log(`Chunked ${scoredChunks.length} source windows; no API call was made.`);
console.log(`Projected standard API cost: $${output.costProjection.total.standardProjectedCost.toFixed(4)}.`);
console.log(`Projected Batch/Flex API cost: $${output.costProjection.total.batchOrFlexProjectedCost.toFixed(4)}.`);
console.log(`Pilot packet: ${relative(repoRoot, outputPath)}`);
