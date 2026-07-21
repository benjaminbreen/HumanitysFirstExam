#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const reviewDirectory = new URL("data-local/review/", root);
const goldUrl = new URL("gold-classifications.json", reviewDirectory);
const packetUrl = new URL("classification-packet.json", reviewDirectory);
const outputUrl = new URL("model-classifications.json", reviewDirectory);
const prepareOnly = process.argv.includes("--prepare");
const allowPaidApi = process.argv.includes("--allow-paid-api");
const model = process.env.HFE_CLASSIFIER_MODEL ?? "gpt-5.6";
const limit = Number(process.env.CLASSIFY_LIMIT ?? "0");

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

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function unique(values) {
  return [...new Set(values)];
}

function outputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
}

async function writeJsonAtomic(url, value) {
  await mkdir(reviewDirectory, { recursive: true });
  const temporaryUrl = new URL(`${url.pathname}.tmp`, "file://");
  await writeFile(temporaryUrl, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryUrl, url);
}

const [schemaText, codebookText, passageText, prompt, envText, goldText] =
  await Promise.all([
    readFile(new URL("src/data/classification_schema.json", root), "utf8"),
    readFile(new URL("src/data/codebook.json", root), "utf8"),
    readFile(new URL("src/data/historical_passages.json", root), "utf8"),
    readFile(new URL("prompts/classify-passages-from-gold.md", root), "utf8"),
    readFile(new URL(".env.local", root), "utf8").catch(() => ""),
    readFile(goldUrl, "utf8").catch(() =>
      JSON.stringify({ schemaVersion: null, annotations: [] }),
    ),
  ]);

const classificationSchema = JSON.parse(schemaText);
const claimBranches = JSON.parse(codebookText).filter(
  (branch) => branch.kind === "claim",
);
const passages = JSON.parse(passageText).passages;
const gold = JSON.parse(goldText);
const goldIds = new Set(gold.annotations.map((item) => item.passageId));
const remaining = passages.filter((passage) => !goldIds.has(passage.id));
const targets = limit > 0 ? remaining.slice(0, limit) : remaining;

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

function passageForModel(passage) {
  return {
    passageId: passage.id,
    author: passage.author,
    title: passage.title,
    year: passage.year,
    language: passage.language,
    originalText: passage.originalText,
    englishText: passage.englishText,
    existingGenreDescription: passage.genre,
    translationReviewStatus: passage.translation.reviewStatus,
  };
}

const examples = gold.annotations.map((annotation) => ({
  passage: passageForModel(
    passages.find((passage) => passage.id === annotation.passageId),
  ),
  historianClassification: annotation,
}));
const packet = {
  schemaVersion: classificationSchema.version,
  preparedAt: new Date().toISOString(),
  goldExampleCount: examples.length,
  targetCount: targets.length,
  goldExamples: examples,
  targets: targets.map(passageForModel),
};
await writeJsonAtomic(packetUrl, packet);

if (prepareOnly) {
  console.log(
    `Prepared ${examples.length} gold examples and ${targets.length} unclassified passages in data-local/review/classification-packet.json. No API call was made.`,
  );
  process.exit(0);
}

if (!allowPaidApi) {
  throw new Error(
    "No API call was made. Run with --allow-paid-api (or npm run classify:from-gold) when you are ready.",
  );
}
if (examples.length < 3) {
  throw new Error(
    `At least 3 historian-classified passages are required; found ${examples.length}.`,
  );
}
if (targets.length === 0) {
  console.log("Every current passage already has a gold classification.");
  process.exit(0);
}

const env = parseEnv(envText);
const apiKey = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY was not found in the environment or .env.local");
}

const ids = {
  themes: classificationSchema.themes.flatMap((theme) =>
    theme.children.map((child) => child.id),
  ),
  claims: claimBranches.flatMap((branch) =>
    branch.leaves.map((leaf) => leaf.id),
  ),
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
    passageId: { type: "string" },
    themes: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string", enum: ids.themes },
    },
    claims: {
      type: "array",
      minItems: 1,
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
      minItems: 1,
      maxItems: 3,
      items: { type: "string", enum: ids.grounds },
    },
    autonomyEffect: { type: "string", enum: ids.autonomyEffects },
    genre: { type: "string", enum: ids.genres },
    modes: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string", enum: ids.modes },
    },
    rationale: { type: "string" },
    needsHumanReview: { type: "boolean" },
  },
  required: [
    "passageId",
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

const goldFingerprint = hash(
  JSON.stringify({ schema: schemaForModel, annotations: gold.annotations }),
);
const previous = JSON.parse(await readFile(outputUrl, "utf8").catch(() => "null"));
const canResume =
  previous?.meta?.model === model &&
  previous?.meta?.goldFingerprint === goldFingerprint;
const suggestions = canResume ? previous.suggestions : [];
let usage = canResume
  ? previous.meta.usage
  : { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

async function checkpoint() {
  await writeJsonAtomic(outputUrl, {
    meta: {
      status: "model-suggestions-for-human-review",
      model,
      schemaVersion: classificationSchema.version,
      goldExampleCount: examples.length,
      goldFingerprint,
      updatedAt: new Date().toISOString(),
      usage,
    },
    suggestions,
  });
}

for (const passage of targets) {
  if (suggestions.some((item) => item.passageId === passage.id)) {
    console.log(`Kept existing suggestion for ${passage.id}`);
    continue;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: `${prompt}\n\nFIXED SCHEMA\n${JSON.stringify(schemaForModel)}\n\nHISTORIAN GOLD EXAMPLES\n${JSON.stringify(examples)}`,
      input: `Classify this target passage:\n${JSON.stringify(passageForModel(passage))}`,
      text: {
        format: {
          type: "json_schema",
          name: "historical_passage_classification",
          strict: true,
          schema: outputSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `${passage.id} classification failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = await response.json();
  const text = outputText(payload);
  if (!text) throw new Error(`${passage.id}: the model returned no structured output`);
  const suggestion = JSON.parse(text);
  if (suggestion.passageId !== passage.id) {
    throw new Error(`${passage.id}: the model returned passageId ${suggestion.passageId}`);
  }

  suggestion.themes = unique(suggestion.themes);
  suggestion.grounds = unique(suggestion.grounds);
  suggestion.modes = unique(suggestion.modes);
  suggestion.status = "model-suggestion";
  suggestion.model = model;
  suggestion.goldExampleCount = examples.length;
  suggestion.generatedAt = new Date().toISOString();
  suggestions.push(suggestion);
  usage = {
    inputTokens: usage.inputTokens + (payload.usage?.input_tokens ?? 0),
    outputTokens: usage.outputTokens + (payload.usage?.output_tokens ?? 0),
    totalTokens: usage.totalTokens + (payload.usage?.total_tokens ?? 0),
  };
  await checkpoint();
  console.log(`Suggested labels for ${passage.id}`);
}

console.log(
  `Wrote ${suggestions.length} model suggestions to data-local/review/model-classifications.json. They remain separate from gold.`,
);
