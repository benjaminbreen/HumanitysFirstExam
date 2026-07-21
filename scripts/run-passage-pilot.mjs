#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const reviewDirectory = new URL("data-local/review/", root);
const chunkUrl = new URL("passage-pilot-chunks.jsonl", reviewDirectory);
const runUrl = new URL("passage-pilot-run.json", reviewDirectory);
const sourceIndexUrl = new URL("src/data/historical_source_texts.json", root);
const passagesUrl = new URL("src/data/historical_passages.json", root);
const questionsUrl = new URL("src/data/question_bank.json", root);
const schemaUrl = new URL("src/data/classification_schema.json", root);
const codebookUrl = new URL("src/data/codebook.json", root);
const promptUrl = new URL("prompts/classify-passages-from-gold.md", root);
const goldUrl = new URL("gold-classifications.json", reviewDirectory);
const preflightUrl = new URL("research/passage-pilot-preflight.json", root);
const reviewedSelectionUrl = new URL("research/passage-pilot-selection.json", root);

const allowPaidApi = process.argv.includes("--allow-paid-api");
const retrieveOnly = process.argv.includes("--retrieve-only");
const classifyOnly = process.argv.includes("--classify-only");
const embeddingModel = process.env.HFE_EMBEDDING_MODEL ?? "text-embedding-3-small";
const classifierModel = process.env.HFE_CLASSIFIER_MODEL ?? "gpt-5.6-luna";
const maximumSpend = Number(process.env.HFE_MAX_USD ?? "0.40");
const pilotSize = Number(process.env.PASSAGE_PILOT_LIMIT ?? "20");
const embeddingBatchSize = 128;
const topChunksPerSource = 8;
// A four-thousand-character ceiling is safely below the 8,192-token item
// limit even for CJK text, OCR fragments, and punctuation-heavy material.
const maximumEmbeddingCharacters = 4_000;

const prices = {
  embeddingInput: 0.02,
  classifierInput: 1,
  classifierOutput: 6,
};

function parseEnv(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
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

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function outputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
}

function usageCost(usage) {
  return (
    (usage.embeddingTokens / 1_000_000) * prices.embeddingInput +
    ((usage.classifierInputTokens + (usage.uncheckpointedClassifierInputEstimate ?? 0)) /
      1_000_000) *
      prices.classifierInput +
    ((usage.classifierOutputTokens + (usage.uncheckpointedClassifierOutputEstimate ?? 0)) /
      1_000_000) *
      prices.classifierOutput
  );
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}

function unique(values) {
  return [...new Set(values)];
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function writeJsonAtomic(url, value) {
  await mkdir(reviewDirectory, { recursive: true });
  const temporaryUrl = new URL(`${url.pathname}.tmp`, "file://");
  await writeFile(temporaryUrl, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, url);
}

function makeSourceQuery(source, questionByNumber) {
  const questionText = source.questions
    .map((number) => questionByNumber.get(number)?.text)
    .filter(Boolean)
    .join("\n");
  return [
    `Find a passage in ${source.title} that makes a substantive argument relevant to Humanity's First Exam.`,
    `The project studies human choice, self-command, responsibility, machines, mechanization, dependence, labour, government, public opinion, and ideas of progress.`,
    `Why this work is in the corpus: ${source.relevance}`,
    `Linked questions:\n${questionText}`,
    `Prefer a passage that takes or examines a position. Mere shared vocabulary, narrative incident, tables of contents, and repository boilerplate are not relevant.`,
  ].join("\n\n");
}

function chooseSelectedSources(run, sourceById, preflight) {
  const correctedPreflight = new Map(
    preflight.candidates.map((candidate) => [candidate.sourceId, candidate]),
  );
  const bestBySource = [];
  for (const [sourceId, topChunks] of Object.entries(run.retrieval.topBySource)) {
    if (!topChunks.length) continue;
    const best = topChunks[0];
    const reviewed = correctedPreflight.get(sourceId);
    const reviewedResult = reviewed
      ? topChunks.find((candidate) => candidate.chunkId === reviewed.chunkId)
      : null;
    const chosen =
      reviewedResult && reviewedResult.semanticScore >= best.semanticScore - 0.04
        ? { ...reviewedResult, selectionMethod: "semantic-plus-local-reading" }
        : { ...best, selectionMethod: "semantic-retrieval" };
    bestBySource.push({
      ...chosen,
      tier: sourceById.get(sourceId)?.tier ?? null,
    });
  }
  bestBySource.sort((left, right) => right.semanticScore - left.semanticScore);

  const selected = bestBySource.slice(0, pilotSize);
  const minimumLongtail = Math.min(4, pilotSize);
  const selectedIds = new Set(selected.map((candidate) => candidate.sourceId));
  const longtailCount = selected.filter((candidate) => candidate.tier === "long-tail").length;
  if (longtailCount < minimumLongtail) {
    const replacements = bestBySource.filter(
      (candidate) => candidate.tier === "long-tail" && !selectedIds.has(candidate.sourceId),
    );
    let needed = minimumLongtail - longtailCount;
    for (const replacement of replacements) {
      const replaceIndex = [...selected]
        .map((candidate, index) => ({ candidate, index }))
        .filter(({ candidate }) => candidate.tier !== "long-tail")
        .sort((left, right) => left.candidate.semanticScore - right.candidate.semanticScore)[0]?.index;
      if (replaceIndex === undefined || needed <= 0) break;
      selected[replaceIndex] = { ...replacement, selectionMethod: "semantic-retrieval-stratified" };
      needed -= 1;
    }
  }

  return selected
    .sort((left, right) => right.semanticScore - left.semanticScore)
    .map((candidate, index) => ({
      pilotId: `pilot-${String(index + 1).padStart(2, "0")}`,
      ...candidate,
    }));
}

if (!allowPaidApi) {
  throw new Error(
    "No API call was made. Re-run with --allow-paid-api after approving the spend ceiling.",
  );
}

const [
  envText,
  chunksText,
  sourceIndexText,
  passagesText,
  questionsText,
  schemaText,
  codebookText,
  promptText,
  goldText,
  preflightText,
  reviewedSelectionText,
  previousText,
] = await Promise.all([
  readFile(new URL(".env.local", root), "utf8").catch(() => ""),
  readFile(chunkUrl, "utf8"),
  readFile(sourceIndexUrl, "utf8"),
  readFile(passagesUrl, "utf8"),
  readFile(questionsUrl, "utf8"),
  readFile(schemaUrl, "utf8"),
  readFile(codebookUrl, "utf8"),
  readFile(promptUrl, "utf8"),
  readFile(goldUrl, "utf8"),
  readFile(preflightUrl, "utf8"),
  readFile(reviewedSelectionUrl, "utf8").catch(() => "null"),
  readFile(runUrl, "utf8").catch(() => "null"),
]);

const env = parseEnv(envText);
const apiKey = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY was not found.");

const chunks = chunksText.trim().split("\n").filter(Boolean).map(JSON.parse);
const sourceIndex = JSON.parse(sourceIndexText).sources;
const passages = JSON.parse(passagesText).passages;
const questions = JSON.parse(questionsText);
const classificationSchema = JSON.parse(schemaText);
const codebook = JSON.parse(codebookText);
const gold = JSON.parse(goldText);
const preflight = JSON.parse(preflightText);
const reviewedSelection = JSON.parse(reviewedSelectionText);
const questionByNumber = new Map(questions.map((question) => [question.n, question]));
const sourceById = new Map(sourceIndex.map((source) => [source.sourceId, source]));
const chunkById = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
const queries = sourceIndex
  .filter((source) => chunks.some((chunk) => chunk.sourceId === source.sourceId))
  .map((source) => ({ sourceId: source.sourceId, text: makeSourceQuery(source, questionByNumber) }));
const fingerprint = hash(
  JSON.stringify({
    embeddingModel,
    classifierModel,
    chunks: chunks.map((chunk) => [chunk.chunkId, hash(chunk.text)]),
    schemaVersion: classificationSchema.version,
    goldUpdatedAt: gold.updatedAt,
  }),
);

const previous = JSON.parse(previousText);
if (previous && previous.meta?.fingerprint !== fingerprint) {
  throw new Error(
    "The pilot inputs changed after a paid run began. Move the previous local run file aside before starting a new run.",
  );
}

const run = previous ?? {
  meta: {
    status: "in-progress-model-suggestions",
    fingerprint,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spendCeilingUsd: maximumSpend,
    embeddingModel,
    classifierModel,
    pricingBasis: "standard, conservative; cached input is charged at full input rate",
  },
  usage: {
    embeddingTokens: 0,
    classifierInputTokens: 0,
    classifierCachedInputTokens: 0,
    classifierOutputTokens: 0,
  },
  retrieval: {
    status: "not-started",
    nextChunkIndex: 0,
    topBySource: {},
    watchedByChunkId: {},
    selected: [],
  },
  classifications: [],
  failures: [],
};

async function checkpoint() {
  run.meta.updatedAt = new Date().toISOString();
  run.meta.usageBasedCostUsd = Number(usageCost(run.usage).toFixed(6));
  await writeJsonAtomic(runUrl, run);
}

function assertBudget(estimatedAdditionalCost, label) {
  const current = usageCost(run.usage);
  if (current + estimatedAdditionalCost > maximumSpend) {
    throw new Error(
      `${label} would exceed the $${maximumSpend.toFixed(2)} ceiling (current conservative cost $${current.toFixed(4)}).`,
    );
  }
}

async function createEmbeddings(input) {
  // Estimate conservatively before making the paid call.
  const estimatedTokens = input.reduce((sum, text) => sum + Math.ceil(text.length / 3), 0);
  assertBudget((estimatedTokens / 1_000_000) * prices.embeddingInput, "Embedding batch");
  // This account currently allows one million embedding tokens per minute.
  // Pace requests by their estimated size and obey a server retry interval.
  const minimumInterval = Math.ceil((estimatedTokens / 1_000_000) * 60_000) + 300;
  const elapsed = Date.now() - (createEmbeddings.lastRequestAt ?? 0);
  if (elapsed < minimumInterval) await sleep(minimumInterval - elapsed);

  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    createEmbeddings.lastRequestAt = Date.now();
    response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: embeddingModel, input, encoding_format: "float" }),
    });
    if (response.ok) break;
    const errorText = await response.text();
    if (response.status !== 429 || attempt === 4) {
      throw new Error(`Embedding request failed (${response.status}): ${errorText}`);
    }
    const secondsFromHeader = Number(response.headers.get("retry-after"));
    const secondsFromMessage = Number(
      errorText.match(/try again in ([0-9.]+)s/i)?.[1] ?? "0",
    );
    const waitMilliseconds = Math.min(
      30_000,
      Math.ceil(Math.max(secondsFromHeader || 0, secondsFromMessage, 2) * 1000) + 500,
    );
    console.log(`Embedding rate limit; resuming in ${(waitMilliseconds / 1000).toFixed(1)}s.`);
    await sleep(waitMilliseconds);
  }
  const payload = await response.json();
  run.usage.embeddingTokens += payload.usage?.total_tokens ?? payload.usage?.prompt_tokens ?? 0;
  return payload.data.sort((left, right) => left.index - right.index).map((item) => item.embedding);
}

if (!classifyOnly && run.retrieval.status !== "complete") {
  run.retrieval.status = "in-progress";
  const queryVectors = await createEmbeddings(queries.map((query) => query.text));
  const queryVectorBySource = new Map(
    queries.map((query, index) => [query.sourceId, queryVectors[index]]),
  );
  await checkpoint();

  const watchedChunkIds = new Set(preflight.candidates.map((candidate) => candidate.chunkId));
  for (
    let startIndex = run.retrieval.nextChunkIndex;
    startIndex < chunks.length;
    startIndex += embeddingBatchSize
  ) {
    const batch = chunks.slice(startIndex, startIndex + embeddingBatchSize);
    const embeddingInputs = batch.map((chunk) =>
      chunk.text.length > maximumEmbeddingCharacters
        ? chunk.text.slice(0, maximumEmbeddingCharacters)
        : chunk.text,
    );
    const vectors = await createEmbeddings(embeddingInputs);
    for (let index = 0; index < batch.length; index += 1) {
      const chunk = batch[index];
      const queryVector = queryVectorBySource.get(chunk.sourceId);
      const semanticScore = cosineSimilarity(vectors[index], queryVector);
      const result = {
        chunkId: chunk.chunkId,
        sourceId: chunk.sourceId,
        semanticScore: Number(semanticScore.toFixed(6)),
        localRetrievalScore: chunk.localRetrievalScore,
        embeddingTruncated: chunk.text.length > maximumEmbeddingCharacters,
      };
      const current = run.retrieval.topBySource[chunk.sourceId] ?? [];
      current.push(result);
      current.sort((left, right) => right.semanticScore - left.semanticScore);
      run.retrieval.topBySource[chunk.sourceId] = current.slice(0, topChunksPerSource);
      if (watchedChunkIds.has(chunk.chunkId)) {
        run.retrieval.watchedByChunkId[chunk.chunkId] = result;
      }
    }
    run.retrieval.nextChunkIndex = startIndex + batch.length;
    if ((Math.floor(startIndex / embeddingBatchSize) + 1) % 4 === 0) {
      await checkpoint();
      console.log(
        `Embedded ${run.retrieval.nextChunkIndex}/${chunks.length} windows; conservative cost $${usageCost(run.usage).toFixed(4)}.`,
      );
    }
  }

  // Make locally reviewed candidates available to the source-level chooser
  // even when they did not land in the semantic top eight.
  for (const result of Object.values(run.retrieval.watchedByChunkId)) {
    const current = run.retrieval.topBySource[result.sourceId] ?? [];
    if (!current.some((candidate) => candidate.chunkId === result.chunkId)) {
      current.push(result);
      current.sort((left, right) => right.semanticScore - left.semanticScore);
      run.retrieval.topBySource[result.sourceId] = current;
    }
  }
  run.retrieval.selected = chooseSelectedSources(run, sourceById, preflight).map(
    (selection) => ({ ...selection, context: chunkById.get(selection.chunkId) }),
  );
  run.retrieval.status = "complete";
  await checkpoint();
  console.log(
    `Retrieval complete: selected ${run.retrieval.selected.length} passages; conservative cost $${usageCost(run.usage).toFixed(4)}.`,
  );
}

if (retrieveOnly) process.exit(0);
if (run.retrieval.status !== "complete") {
  throw new Error("Retrieval has not completed. Run --retrieve-only first.");
}

if (reviewedSelection?.selections?.length) {
  if (run.classifications.length > 0 && run.meta.selectionSource !== "research/passage-pilot-selection.json") {
    throw new Error("The reviewed selection changed after classification began.");
  }
  if (run.classifications.length === 0) {
    run.retrieval.selected = reviewedSelection.selections.map((selection, index) => {
      const context = chunkById.get(selection.chunkId);
      if (!context || context.sourceId !== selection.sourceId) {
        throw new Error(`Reviewed selection is invalid: ${selection.chunkId}`);
      }
      const ranked = (run.retrieval.topBySource[selection.sourceId] ?? []).find(
        (candidate) => candidate.chunkId === selection.chunkId,
      );
      const watched = run.retrieval.watchedByChunkId[selection.chunkId];
      return {
        pilotId: `pilot-${String(index + 1).padStart(2, "0")}`,
        sourceId: selection.sourceId,
        chunkId: selection.chunkId,
        semanticScore: ranked?.semanticScore ?? watched?.semanticScore ?? null,
        localRetrievalScore: context.localRetrievalScore,
        selectionMethod: "local-reading-after-semantic-retrieval",
        selectionReason: selection.reason,
        tier: sourceById.get(selection.sourceId)?.tier ?? null,
        context,
      };
    });
    run.meta.selectionSource = "research/passage-pilot-selection.json";
    await checkpoint();
  }
}

const claimBranches = codebook.filter((branch) => branch.kind === "claim");
const schemaForModel = {
  version: classificationSchema.version,
  themes: classificationSchema.themes,
  claims: claimBranches,
  relations: classificationSchema.relations,
  grounds: classificationSchema.grounds,
  autonomyEffects: classificationSchema.autonomyEffects,
  genres: classificationSchema.genres,
  modes: classificationSchema.modes,
};
const ids = {
  themes: classificationSchema.themes.flatMap((theme) =>
    theme.children.map((child) => child.id),
  ),
  claims: claimBranches.flatMap((branch) => branch.leaves.map((leaf) => leaf.id)),
  relations: classificationSchema.relations.map((item) => item.id),
  grounds: classificationSchema.grounds.map((item) => item.id),
  autonomyEffects: classificationSchema.autonomyEffects.map((item) => item.id),
  genres: classificationSchema.genres.map((item) => item.id),
  modes: classificationSchema.modes.map((item) => item.id),
};
const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pilotId: { type: "string" },
    relevant: { type: "boolean" },
    passageText: { type: "string" },
    englishTranslation: { type: "string" },
    locatorSuggestion: { type: "string" },
    themes: {
      type: "array",
      maxItems: 3,
      items: { type: "string", enum: ids.themes },
    },
    claims: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          claimId: { type: "string", enum: ids.claims },
          relation: { type: "string", enum: ids.relations },
        },
        required: ["claimId", "relation"],
      },
    },
    grounds: {
      type: "array",
      maxItems: 3,
      items: { type: "string", enum: ids.grounds },
    },
    autonomyEffect: { type: "string", enum: ids.autonomyEffects },
    genre: { type: "string", enum: ids.genres },
    modes: {
      type: "array",
      maxItems: 3,
      items: { type: "string", enum: ids.modes },
    },
    rationale: { type: "string" },
    needsHumanReview: { type: "boolean" },
  },
  required: [
    "pilotId",
    "relevant",
    "passageText",
    "englishTranslation",
    "locatorSuggestion",
    "themes",
    "claims",
    "grounds",
    "autonomyEffect",
    "genre",
    "modes",
    "rationale",
    "needsHumanReview",
  ],
};

const goldExamples = gold.annotations.map((annotation) => {
  const passage = passages.find((item) => item.id === annotation.passageId);
  return {
    passage: {
      passageId: passage.id,
      author: passage.author,
      title: passage.title,
      year: passage.year,
      language: passage.language,
      text: passage.englishText ?? passage.originalText,
    },
    historianClassification: {
      themes: annotation.themes,
      claims: annotation.claims,
      grounds: annotation.grounds,
      autonomyEffect: annotation.autonomyEffect,
      genre: annotation.genre,
      modes: annotation.modes,
    },
  };
});
const instructions = [
  promptText,
  "This pass also extracts the usable passage from a larger source window.",
  "A relevant passage must take, defend, reject, or seriously examine a position bearing on human autonomy, agency, machines, mechanization, labour, governance, public opinion, or progress. Shared vocabulary alone is not enough.",
  "Copy one contiguous 120–220 word passage verbatim from the source window, beginning and ending at complete sentence boundaries. Do not modernize spelling or silently repair OCR.",
  "If the source is not English, put the exact original in passageText and a close working translation in englishTranslation. Otherwise return an empty string for englishTranslation.",
  "The locator is provisional. Use the supplied heading and word range; never invent a page number.",
  "If the window is not relevant, set relevant false, use an empty passage and empty label arrays, explain why briefly, and flag human review.",
  `FIXED SCHEMA\n${JSON.stringify(schemaForModel)}`,
  `HISTORIAN GOLD EXAMPLES\n${JSON.stringify(goldExamples)}`,
].join("\n\n");

for (const selection of run.retrieval.selected) {
  if (run.classifications.some((item) => item.pilotId === selection.pilotId)) {
    continue;
  }
  // A conservative allowance for the next request keeps the run under the
  // approved ceiling even if the output is longer than expected.
  const estimatedInputTokens = Math.ceil(
    (instructions.length + JSON.stringify(selection).length) / 3,
  );
  const estimatedRequestCost =
    (estimatedInputTokens / 1_000_000) * prices.classifierInput +
    (900 / 1_000_000) * prices.classifierOutput;
  assertBudget(estimatedRequestCost, `Classification ${selection.pilotId}`);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: classifierModel,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 1600,
      instructions,
      input: `Extract and classify this candidate:\n${JSON.stringify(selection)}`,
      text: {
        format: {
          type: "json_schema",
          name: "passage_pilot_classification",
          strict: true,
          schema: outputSchema,
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(
      `${selection.pilotId} classification failed (${response.status}): ${await response.text()}`,
    );
  }
  const payload = await response.json();
  const text = outputText(payload);
  run.usage.classifierInputTokens += payload.usage?.input_tokens ?? 0;
  run.usage.classifierCachedInputTokens +=
    payload.usage?.input_tokens_details?.cached_tokens ?? 0;
  run.usage.classifierOutputTokens += payload.usage?.output_tokens ?? 0;
  if (!text) {
    run.failures ??= [];
    run.failures.push({
      pilotId: selection.pilotId,
      responseId: payload.id,
      responseStatus: payload.status,
      incompleteDetails: payload.incomplete_details,
      rawOutput: null,
      error: "Model returned no structured output.",
      generatedAt: new Date().toISOString(),
    });
    await checkpoint();
    throw new Error(`${selection.pilotId}: model returned no structured output.`);
  }
  let result;
  try {
    result = JSON.parse(text);
  } catch (error) {
    run.failures ??= [];
    run.failures.push({
      pilotId: selection.pilotId,
      responseId: payload.id,
      responseStatus: payload.status,
      incompleteDetails: payload.incomplete_details,
      rawOutput: text,
      error: error instanceof Error ? error.message : String(error),
      generatedAt: new Date().toISOString(),
    });
    await checkpoint();
    throw error;
  }
  if (result.pilotId !== selection.pilotId) {
    throw new Error(`${selection.pilotId}: model returned pilotId ${result.pilotId}.`);
  }
  const context = selection.context.text;
  result.themes = unique(result.themes);
  result.grounds = unique(result.grounds);
  result.modes = unique(result.modes);
  result.source = {
    sourceId: selection.sourceId,
    author: selection.context.author,
    title: selection.context.title,
    year: selection.context.year,
    language: selection.context.language,
    sourceUrl: selection.context.sourceUrl,
    contextChunkId: selection.chunkId,
    provisionalLocator: selection.context.provisionalLocator,
  };
  result.extraction = {
    exactContiguousMatch: result.passageText ? context.includes(result.passageText) : false,
    wordCount: result.passageText.trim().split(/\s+/u).filter(Boolean).length,
  };
  result.status = "model-suggestion-for-historian-review";
  result.model = classifierModel;
  result.generatedAt = new Date().toISOString();
  run.classifications.push(result);
  await checkpoint();
  console.log(
    `Classified ${run.classifications.length}/${run.retrieval.selected.length}; conservative cost $${usageCost(run.usage).toFixed(4)}.`,
  );
}

run.meta.status =
  run.classifications.length === run.retrieval.selected.length
    ? "complete-model-suggestions-for-historian-review"
    : "stopped-before-spend-ceiling";
await checkpoint();
console.log(
  `Pilot status: ${run.meta.status}. ${run.classifications.length} classifications. Conservative usage-based cost $${usageCost(run.usage).toFixed(4)}.`,
);
