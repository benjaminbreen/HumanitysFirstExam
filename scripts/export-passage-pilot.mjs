#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const runUrl = new URL("data-local/review/passage-pilot-run.json", root);
const outputUrl = new URL("src/data/prototype_passages.json", root);

const run = JSON.parse(await readFile(runUrl, "utf8"));
const passages = run.classifications.map((classification) => ({
  id: classification.pilotId,
  sourceId: classification.source.sourceId,
  author: classification.source.author,
  title: classification.source.title,
  year: classification.source.year,
  language: classification.source.language,
  locator: classification.source.provisionalLocator,
  sourceUrl: classification.source.sourceUrl,
  originalText:
    classification.extraction.requiresSourceReview ||
    !classification.extraction.sourceSpanText
      ? classification.passageText
      : classification.extraction.sourceSpanText,
  englishText: classification.englishTranslation || null,
  sourceCheckRequired: classification.extraction.requiresSourceReview,
  sourceMatchLevel: classification.extraction.matchLevel,
  classification: {
    status: "working-prototype-classification",
    themes: classification.themes,
    claims: classification.claims,
    grounds: classification.grounds,
    autonomyEffect: classification.autonomyEffect,
    genre: classification.genre,
    modes: classification.modes,
    rationale: classification.rationale,
  },
}));

const output = {
  meta: {
    version: "prototype-passages-0.1",
    status: "working-prototype-classifications",
    generatedAt: new Date().toISOString(),
    model: run.meta.classifierModel,
    passageCount: passages.length,
    sourceCheckRequiredCount: passages.filter(
      (passage) => passage.sourceCheckRequired,
    ).length,
    note: "Working prototype tags delegated to the coding model. They may be corrected in the local review workspace; they are not presented as historian-verified gold data.",
  },
  passages,
};

await writeFile(outputUrl, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(
  `Exported ${passages.length} working passages to src/data/prototype_passages.json.`,
);
