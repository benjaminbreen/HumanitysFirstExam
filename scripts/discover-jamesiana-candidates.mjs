#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const bank = JSON.parse(await readFile(new URL("src/data/question_bank.json", root), "utf8"));
const questionIds = (process.env.QUESTION_IDS ?? "1,8,17,34,57,70,77,78")
  .split(",").map(Number);
const questions = bank.filter(q => questionIds.includes(q.n));
const limit = Number(process.env.TOP_K ?? "5");

const candidates = [];
for (const question of questions) {
  const params = new URLSearchParams({
    q: question.text,
    mode: "semantic",
    corpus: "primary",
    limit: String(limit),
  });
  const response = await fetch(`https://jamesiana.vercel.app/api/search?${params}`);
  if (!response.ok) throw new Error(`Jamesiana Q${question.n}: ${response.status}`);
  const result = await response.json();
  candidates.push({
    questionId: question.n,
    question: question.text,
    query: question.text,
    results: result.results.map(item => ({
      passageId: item.passageId,
      sourceId: item.sourceId,
      author: item.authorName,
      title: item.workTitle,
      year: item.year,
      chapter: item.chapterTitle ?? item.chapter,
      page: item.page,
      lineStart: item.lineStart,
      text: item.text,
      score: item.score,
      semanticScore: item.retrieval?.semanticScore ?? null,
      corpusRole: item.corpusRole,
      sourceType: item.sourceType,
      jamesianaUrl: `https://jamesiana.vercel.app/sources/${encodeURIComponent(item.sourceId)}#document-passage-${encodeURIComponent(item.passageId)}`,
      reviewStatus: "unreviewed",
    })),
  });
  console.log(`Q${question.n}: ${result.results.length} candidates`);
}

await writeFile(
  new URL("research/jamesiana-discovery-pilot.json", root),
  JSON.stringify({
    meta: {
      status: "discovery-candidates-only",
      createdAt: new Date().toISOString(),
      mechanism: "Jamesiana semantic search",
      corpus: "primary",
      topK: limit,
      note: "Search results require human verification before ingestion or gold tagging.",
    },
    questions: candidates,
  }, null, 2) + "\n",
);
console.log("Wrote research/jamesiana-discovery-pilot.json");
