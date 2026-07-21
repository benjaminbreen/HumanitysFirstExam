import codebookData from "@/data/codebook.json";
import corpusWorks from "@/data/corpus_works.json";
import erewhonExperiment from "@/data/erewhon_experiment.json";
import questionBank from "@/data/question_bank.json";
import bundle from "@/data/site_bundle.json";
import type {
  Band,
  CodebookBranch,
  CorpusWork,
  Family,
  PerspectiveExperiment,
  Question,
  SiteBundle,
  Survey,
  Topic,
  Verdict,
} from "./types";

export const data = bundle as SiteBundle;
export const questions = questionBank as Question[];
export const works = corpusWorks as CorpusWork[];
export const erewhon = erewhonExperiment as PerspectiveExperiment;
export const codebook = codebookData as CodebookBranch[];

const leafById = new Map(
  codebook.flatMap((b) =>
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
    blurb: "Live controversies inside 1860–1930. High self-disagreement across draws is signal, not noise.",
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
    blurb: "A live controversy inside 1860–1930. Disagreement among the samples is signal — the debate as it stood.",
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
