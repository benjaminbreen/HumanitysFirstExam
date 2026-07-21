import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const manifestPath = join(repoRoot, "research", "historical-source-manifest.json");
const passagesPath = join(repoRoot, "src", "data", "historical_passages.json");
const questionsPath = join(repoRoot, "src", "data", "question_bank.json");
const sourceDir = join(repoRoot, "data-local", "historical-sources");
const publicTextDir = join(repoRoot, "public", "source-texts");
const outputPath = join(repoRoot, "src", "data", "historical_source_texts.json");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const passages = JSON.parse(readFileSync(passagesPath, "utf8")).passages;
const questions = JSON.parse(readFileSync(questionsPath, "utf8"));
const passageBySourceId = new Map(passages.map((passage) => [passage.sourceId, passage]));
const questionByNumber = new Map(questions.map((question) => [question.n, question]));

function normalizeText(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

mkdirSync(publicTextDir, { recursive: true });

const sources = manifest.map((record) => {
  const localPath = join(sourceDir, record.id + ".txt");
  if (!existsSync(localPath)) {
    throw new Error(
      record.id + ": missing source text " + relative(repoRoot, localPath),
    );
  }

  const fullText = normalizeText(readFileSync(localPath, "utf8"));
  const publicFilename = record.id + ".txt";
  writeFileSync(join(publicTextDir, publicFilename), fullText + "\n");

  const passage = passageBySourceId.get(record.id);
  const questionRecords = record.questions
    .map((number) => questionByNumber.get(number))
    .filter(Boolean);

  return {
    sourceId: record.id,
    passageId: passage?.id ?? null,
    author: record.author,
    title: record.title,
    year: record.year,
    language: record.language,
    region: record.region ?? passage?.region ?? null,
    tier: record.tier,
    relevance: record.relevance,
    questions: record.questions,
    subjects: unique(questionRecords.map((question) => question.axis)),
    sourceUrl: record.sourcePage,
    textPath: "/source-texts/" + publicFilename,
    status:
      record.download?.kind === "direct_pdf"
        ? "ocr-transcription"
        : "repository-text",
    wordCount: fullText.split(/\s+/u).filter(Boolean).length,
    characterCount: fullText.length,
    sha256: createHash("sha256").update(fullText).digest("hex"),
  };
});

const output = {
  meta: {
    generatedFrom: [
      relative(repoRoot, manifestPath),
      relative(repoRoot, passagesPath),
      relative(repoRoot, questionsPath),
    ],
    sourceCount: sources.length,
    note:
      "Public reading-copy index. Each text is emitted separately under public/source-texts so source pages load only the requested work.",
  },
  sources,
};

writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
console.log(
  "built " +
    sources.length +
    " reading texts and " +
    relative(repoRoot, outputPath),
);
