import codebookData from "@/data/codebook.json";
import classificationSchemaData from "@/data/classification_schema.json";
import companionshipExperiment from "@/data/companionship_experiment.json";
import { corpusCodingRecords } from "@/data/corpus_coding";
import corpusWorks from "@/data/corpus_works.json";
import engineExperiment from "@/data/engine_experiment.json";
import erewhonExperiment from "@/data/erewhon_experiment.json";
import governanceExperiment from "@/data/governance_experiment.json";
import historicalPassageData from "@/data/historical_passages.json";
import historicalSourceTextData from "@/data/historical_source_texts.json";
import liveRunsData from "@/data/live_runs.json";
import personaExperiment from "@/data/persona_experiment.json";
import progressExperiment from "@/data/progress_experiment.json";
import prototypePassageData from "@/data/prototype_passages.json";
import questionBank from "@/data/question_bank.json";
import questionSourceMatchData from "@/data/question_source_matches.json";
import q33AnswerKeyData from "@/data/q33_answer_key.json";
import reckoningExperiment from "@/data/reckoning_experiment.json";
import relationshipMapData from "@/data/relationship_map.json";
import relianceExperiment from "@/data/reliance_experiment.json";
import relationshipsData from "@/data/relationships.json";
import bundle from "@/data/site_bundle.json";
import subjectionExperiment from "@/data/subjection_experiment.json";
import virtueExperiment from "@/data/virtue_experiment.json";
import type {
  Band,
  CodebookBranch,
  ClassificationSchema,
  CorpusWork,
  CorpusCodingRecord,
  Family,
  FramedExperiment,
  HistoricalPassageDataset,
  HistoricalSourceTextDataset,
  LiveRuns,
  PerspectiveExperiment,
  PrototypePassageDataset,
  Question,
  QuestionAnswerKey,
  QuestionSourceMatchDataset,
  RelationshipMap,
  RelationshipsDoc,
  SiteBundle,
  Survey,
  Topic,
  Verdict,
} from "./types";

export const data = bundle as SiteBundle;
export const questions = questionBank as Question[];
export const questionSourceMatches =
  questionSourceMatchData as QuestionSourceMatchDataset;
export const q33AnswerKey = q33AnswerKeyData as QuestionAnswerKey;
export const works = corpusWorks as CorpusWork[];
export const corpusCoding = corpusCodingRecords as unknown as CorpusCodingRecord[];
export const erewhon = erewhonExperiment as PerspectiveExperiment;
const allCodebook = codebookData as CodebookBranch[];
export const codebook = allCodebook.filter((branch) => branch.kind === "claim");
export const responseDiagnostics = allCodebook.filter(
  (branch) => branch.kind === "diagnostic",
);
export const classificationSchema =
  classificationSchemaData as ClassificationSchema;
export const liveRuns = liveRunsData as LiveRuns;
export const historicalPassages = historicalPassageData as HistoricalPassageDataset;
export const prototypePassages = prototypePassageData as PrototypePassageDataset;
export const historicalSourceTexts =
  historicalSourceTextData as HistoricalSourceTextDataset;
export const relationships = relationshipsData as RelationshipsDoc;
export const engine = engineExperiment as FramedExperiment;
export const persona = personaExperiment as FramedExperiment;
export const governance = governanceExperiment as FramedExperiment;
export const companionship = companionshipExperiment as FramedExperiment;
export const virtue = virtueExperiment as FramedExperiment;
export const reliance = relianceExperiment as FramedExperiment;
export const reckoning = reckoningExperiment as FramedExperiment;
export const progress = progressExperiment as FramedExperiment;
export const subjection = subjectionExperiment as FramedExperiment;
export const relationshipMap = relationshipMapData as RelationshipMap;

const leafById = new Map(
  allCodebook.flatMap((b) =>
    b.leaves.map((l) => [l.id, { ...l, branchId: b.id, branchLabel: b.label }]),
  ),
);

export function getCode(id: string) {
  return leafById.get(id);
}

/** Aggregate a survey's draw counts by codebook code. */
export function codeCounts(survey: Survey): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of survey.clusters) {
    out.set(c.code, (out.get(c.code) ?? 0) + c.count);
  }
  return out;
}

export const VERDICT_META: Record<
  Verdict,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  mad: {
    label: "mad",
    text: "text-period",
    bg: "bg-period/10",
    border: "border-period/40",
    dot: "bg-period",
  },
  wise: {
    label: "wise",
    text: "text-continuity",
    bg: "bg-continuity/10",
    border: "border-continuity/40",
    dot: "bg-continuity",
  },
  mixed: {
    label: "mixed",
    text: "text-falsecont",
    bg: "bg-falsecont/10",
    border: "border-falsecont/40",
    dot: "bg-falsecont",
  },
};

export function getTopic(slug: string): Topic | undefined {
  return data.topics.find((t) => t.slug === slug);
}

export const FAMILY_ORDER: Family[] = ["A", "B", "C1", "C2"];

export const FAMILY_META: Record<Family, { label: string; blurb: string }> = {
  A: {
    label: "Family A — period-native disagreement",
    blurb: "Live controversies inside 1850–1940. High self-disagreement across draws is signal, not noise.",
  },
  B: {
    label: "Family B — period-novel inventions, described not named",
    blurb: "Post-period things in period vocabulary, ordered by seed-availability (referent in brackets). Measured surprise is plotted against this gradient to validate the metric.",
  },
  C1: {
    label: "Family C1 — sci-fi anchors the corpus holds",
    blurb: "Pre-1930 scenarios the model has read (Erewhon, Frankenstein, R.U.R.). Controls.",
  },
  C2: {
    label: "Family C2 — horizon provocations",
    blurb: "Post-1930 scenarios, de-named. The engagement gap between C1 and C2 is itself a measurement.",
  },
};

export const BAND_ORDER: Band[] = ["native", "partial", "horizon"];

export const BAND_META: Record<
  Band,
  { label: string; blurb: string; text: string; bg: string; border: string; dot: string }
> = {
  native: {
    label: "Period-native",
    blurb: "A live controversy inside 1850–1940. Disagreement among the samples is signal — the debate as it stood.",
    text: "text-period",
    bg: "bg-period/10",
    border: "border-period/40",
    dot: "bg-period",
  },
  partial: {
    label: "Partial seed",
    blurb: "The seed of the thing exists in the corpus; its full form came later. Expect strained but real engagement.",
    text: "text-falsecont",
    bg: "bg-falsecont/10",
    border: "border-falsecont/40",
    dot: "bg-falsecont",
  },
  horizon: {
    label: "Past the horizon",
    blurb: "Post-1930, described in period vocabulary. Where the samples break down, the edge of the sayable becomes visible.",
    text: "text-modern",
    bg: "bg-modern/10",
    border: "border-modern/40",
    dot: "bg-modern",
  },
};
