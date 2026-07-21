#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const discoveryUrl = new URL("research/jamesiana-discovery-pilot.json", root);
const manifestUrl = new URL("research/historical-source-manifest.json", root);
const ledgerUrl = new URL("research/multilingual-long-tail-passages.json", root);
const questionUrl = new URL("src/data/question_bank.json", root);
const localDir = new URL("data-local/historical-sources/", root);

const [discovery, manifest, ledger, questions] = await Promise.all([
  readFile(discoveryUrl, "utf8").then(JSON.parse),
  readFile(manifestUrl, "utf8").then(JSON.parse),
  readFile(ledgerUrl, "utf8").then(JSON.parse),
  readFile(questionUrl, "utf8").then(JSON.parse),
]);
const questionById = new Map(questions.map(q => [q.n, q]));
const found = new Map();
for (const group of discovery.questions) {
  for (const result of group.results) {
    const key = `${result.sourceId}:${result.passageId}`;
    const current = found.get(key) ?? { ...result, questionIds: [] };
    current.questionIds = [...new Set([...current.questionIds, group.questionId])].sort((a, b) => a - b);
    found.set(key, current);
  }
}
const sourceGroups = new Map();
for (const result of found.values()) {
  const current = sourceGroups.get(result.sourceId) ?? [];
  current.push(result); sourceGroups.set(result.sourceId, current);
}

async function fetchSource(sourceId) {
  const passages = []; let offset = 0; let source;
  do {
    const url = `https://jamesiana.vercel.app/api/sources/${encodeURIComponent(sourceId)}?offset=${offset}&limit=250`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${sourceId}: ${response.status}`);
    const page = await response.json();
    source ??= page.source;
    passages.push(...page.passages);
    if (!page.hasMore || page.nextOffset == null) break;
    offset = page.nextOffset;
  } while (true);
  return { source, passages };
}

const importedSources = [];
for (const [jamesianaId, results] of sourceGroups) {
  const { source, passages } = await fetchSource(jamesianaId);
  const sourceId = `jamesiana-${jamesianaId}`;
  const year = Number(source.metadata?.year ?? source.date_label);
  const text = passages.map((p) => {
    const locator = [p.metadata?.chapterTitle ?? p.metadata?.sectionTitle, p.page_start ? `p. ${p.page_start}` : null]
      .filter(Boolean).join(" · ");
    return `${locator ? `[${locator}]\n` : ""}${String(p.text ?? p.corrected_text ?? p.raw_text ?? "").trim()}`;
  }).filter(Boolean).join("\n\n");
  await writeFile(new URL(`${sourceId}.txt`, localDir), text + "\n");
  const questionIds = [...new Set(results.flatMap(r => r.questionIds))].sort((a, b) => a - b);
  const record = {
    id: sourceId,
    tier: "jamesiana_discovery",
    author: source.creator ?? results[0].author,
    title: source.title ?? results[0].title,
    year,
    language: "English",
    region: "United States",
    questions: questionIds,
    relevance: `Semantic-search discovery in Jamesiana for questions ${questionIds.map(n => `Q${n}`).join(", ")}; human gold tagging pending.`,
    sourcePage: `https://jamesiana.vercel.app/sources/${encodeURIComponent(jamesianaId)}`,
    originalSource: source.original_url ?? source.metadata?.sourceUrl ?? null,
    download: { kind: "jamesiana_api", url: `https://jamesiana.vercel.app/api/sources/${encodeURIComponent(jamesianaId)}` },
  };
  const index = manifest.findIndex(item => item.id === sourceId);
  if (index >= 0) manifest[index] = record; else manifest.push(record);
  importedSources.push({ sourceId, jamesianaId, source, results });
  console.log(`${sourceId}: ${passages.length} passages`);
}

ledger.passages = ledger.passages.filter(p => !p.sourceId.startsWith("jamesiana-"));
const existingPassageIds = new Set(ledger.passages.map(p => p.id));
const importedPassageIds = new Set();
let sequence = 1;
for (const { sourceId, source, results } of importedSources) {
  for (const result of results) {
    if (result.year < 1850 || result.year > 1940) continue;
    let id = `JTP-${String(sequence++).padStart(3, "0")}`;
    while (existingPassageIds.has(id)) id = `JTP-${String(sequence++).padStart(3, "0")}`;
    importedPassageIds.add(id);
    const locator = [result.chapter, result.page ? `p. ${result.page}` : null, result.lineStart ? `line ${result.lineStart}` : null]
      .filter(Boolean).join(" · ");
    ledger.passages.push({
      id,
      sourceId,
      author: source.creator ?? result.author,
      title: source.title ?? result.title,
      year: result.year,
      language: "English",
      region: "United States",
      genre: source.source_type ?? result.sourceType ?? "nonfiction",
      locator: locator || `Jamesiana passage ${result.passageId}`,
      original: result.text,
      workingTranslation: null,
      proposedQuestion: questionById.get(result.questionIds[0])?.text ?? "How does this passage bear on human autonomy?",
      nathanQuestionNumbers: result.questionIds,
      codebookLeafIds: [],
      codebookGap: "Pending human classification in /admin.",
      provenanceRelationship: "Discovered through Jamesiana semantic search; no dependency claim made at ingestion.",
      sourceUrl: result.jamesianaUrl,
      sourceStatus: "Jamesiana repository passage and locator imported; human gold tagging pending.",
      translationStatus: "original is English",
      sourceVerificationLevel: "repository-text-checked",
      translationReviewStatus: "not-needed",
      transmissionType: "no-known-direct-dependency",
      independentConvergenceStatus: "candidate",
    });
  }
}
ledger.passages = ledger.passages.filter((p, index, all) => all.findIndex(x => x.id === p.id) === index);
manifest.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
await Promise.all([
  writeFile(manifestUrl, JSON.stringify(manifest, null, 2) + "\n"),
  writeFile(ledgerUrl, JSON.stringify(ledger, null, 2) + "\n"),
]);
console.log(`Imported ${importedSources.length} sources and ${importedPassageIds.size} in-period passages.`);
