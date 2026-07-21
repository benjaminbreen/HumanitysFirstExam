#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const runUrl = new URL("data-local/review/passage-pilot-run.json", root);
const summaryUrl = new URL("data-local/review/passage-pilot-audit.json", root);

function normalizedWithMap(value) {
  let normalized = "";
  const map = [];
  let inWhitespace = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (/\s/u.test(character)) {
      if (!inWhitespace && normalized.length > 0) {
        normalized += " ";
        map.push(index);
      }
      inWhitespace = true;
    } else {
      normalized += character;
      map.push(index);
      inWhitespace = false;
    }
  }
  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1);
    map.pop();
  }
  return { normalized, map };
}

function exactSpanFromNormalized(source, target) {
  const sourceMapped = normalizedWithMap(source);
  const targetNormalized = normalizedWithMap(target).normalized;
  const normalizedStart = sourceMapped.normalized.indexOf(targetNormalized);
  if (normalizedStart < 0) return null;
  const normalizedEnd = normalizedStart + targetNormalized.length - 1;
  const sourceStart = sourceMapped.map[normalizedStart];
  const sourceEnd = sourceMapped.map[normalizedEnd] + 1;
  return source.slice(sourceStart, sourceEnd);
}

function anchoredSpan(source, target) {
  const sourceMapped = normalizedWithMap(source);
  const targetNormalized = normalizedWithMap(target).normalized;
  const anchorLength = 90;
  const anchors = [];
  for (let start = 0; start < targetNormalized.length; start += 120) {
    const text = targetNormalized.slice(start, start + anchorLength);
    if (text.length < 60) continue;
    anchors.push({ targetStart: start, text });
  }
  const matches = [];
  let searchFrom = 0;
  for (const anchor of anchors) {
    const sourceStart = sourceMapped.normalized.indexOf(anchor.text, searchFrom);
    if (sourceStart < 0) continue;
    matches.push({ ...anchor, sourceStart });
    searchFrom = sourceStart + anchor.text.length;
  }
  if (matches.length < 2) return null;
  const first = matches[0];
  const last = matches[matches.length - 1];
  const normalizedStart = first.sourceStart;
  const normalizedEnd = last.sourceStart + last.text.length - 1;
  const sourceStart = sourceMapped.map[normalizedStart];
  const sourceEnd = sourceMapped.map[normalizedEnd] + 1;
  return {
    text: source.slice(sourceStart, sourceEnd),
    matchedAnchorCount: matches.length,
    possibleAnchorCount: anchors.length,
    targetCoverage: Number(
      ((last.targetStart + last.text.length - first.targetStart) / targetNormalized.length).toFixed(3),
    ),
  };
}

const run = JSON.parse(await readFile(runUrl, "utf8"));
const selectionByPilotId = new Map(
  run.retrieval.selected.map((selection) => [selection.pilotId, selection]),
);
const audits = [];

for (const classification of run.classifications) {
  const selection = selectionByPilotId.get(classification.pilotId);
  const context = selection.context.text;
  const fullSourceUrl = new URL(
    `public/source-texts/${classification.source.sourceId}.txt`,
    root,
  );
  const fullSource = await readFile(fullSourceUrl, "utf8");
  let matchLevel = "unresolved";
  let sourceSpanText = null;
  let anchorEvidence = null;

  if (context.includes(classification.passageText)) {
    matchLevel = "exact-selected-window";
    sourceSpanText = classification.passageText;
  } else {
    sourceSpanText = exactSpanFromNormalized(context, classification.passageText);
    if (sourceSpanText) {
      matchLevel = "whitespace-normalized-selected-window";
    } else if (fullSource.includes(classification.passageText)) {
      matchLevel = "exact-full-source-outside-selected-window";
      sourceSpanText = classification.passageText;
    } else {
      sourceSpanText = exactSpanFromNormalized(fullSource, classification.passageText);
      if (sourceSpanText) {
        matchLevel = "whitespace-normalized-full-source-outside-selected-window";
      } else {
        const anchored = anchoredSpan(fullSource, classification.passageText);
        if (anchored) {
          matchLevel = "partial-anchors-in-full-source";
          sourceSpanText = anchored.text;
          anchorEvidence = {
            matchedAnchorCount: anchored.matchedAnchorCount,
            possibleAnchorCount: anchored.possibleAnchorCount,
            targetCoverage: anchored.targetCoverage,
          };
        }
      }
    }
  }

  const requiresSourceReview = ![
    "exact-selected-window",
    "whitespace-normalized-selected-window",
  ].includes(matchLevel);
  classification.extraction = {
    ...classification.extraction,
    matchLevel,
    sourceSpanText,
    anchorEvidence,
    requiresSourceReview,
  };
  if (requiresSourceReview) classification.needsHumanReview = true;
  audits.push({
    pilotId: classification.pilotId,
    sourceId: classification.source.sourceId,
    matchLevel,
    requiresSourceReview,
    relevant: classification.relevant,
    labelCounts: {
      themes: classification.themes.length,
      claims: classification.claims.length,
      grounds: classification.grounds.length,
      modes: classification.modes.length,
    },
  });
}

run.meta.auditedAt = new Date().toISOString();
run.meta.auditStatus = "model-suggestions-checked-against-local-source-text";
await writeFile(runUrl, `${JSON.stringify(run, null, 2)}\n`, "utf8");

const matchLevels = Object.fromEntries(
  [...new Set(audits.map((audit) => audit.matchLevel))].map((level) => [
    level,
    audits.filter((audit) => audit.matchLevel === level).length,
  ]),
);
const summary = {
  status: "pilot-audit-complete",
  auditedAt: run.meta.auditedAt,
  passageCount: audits.length,
  relevantCount: audits.filter((audit) => audit.relevant).length,
  sourceReviewRequiredCount: audits.filter((audit) => audit.requiresSourceReview).length,
  overThreeLabelsCount: audits.filter((audit) =>
    Object.values(audit.labelCounts).some((count) => count > 3),
  ).length,
  matchLevels,
  usage: run.usage,
  conservativeUsageBasedCostUsd: run.meta.usageBasedCostUsd,
  retainedFailedAttemptCount: run.failures?.length ?? 0,
  audits,
};
await writeFile(summaryUrl, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));
