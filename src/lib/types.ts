/**
 * Data model for "Second Opinions from the Machine Age".
 *
 * The site renders entirely from `src/data/site_bundle.json`, which mirrors
 * the file the eventual pipeline will export. One Topic = one page = one
 * exercise in judgment: a question, a modern model's sampled answers, the
 * period distribution sampled from Talkie, and the primary sources to check
 * both against.
 */

/**
 * Temporal band of a topic, following Nathan Davies's question-bank coding:
 * - native:  a live controversy inside 1860–1930; period disagreement is signal
 * - partial: the seed of the thing exists in the corpus; the full form is later
 * - horizon: post-1930; the period corpus has no name for it — breakdown in
 *            the samples is itself the measurement
 */
export type Band = "native" | "partial" | "horizon";

/** A real primary-source passage grounding a topic. */
export interface SourcePassage {
  id: string;
  author: string;
  title: string;
  year: number;
  /** Chapter / page / issue locator. */
  citation: string;
  /** Link to a readable copy. */
  url?: string;
  text: string;
  /** True when the text was checked verbatim against a local source file. */
  verified: boolean;
  /** Where the local copy lives (repo/corpus provenance). */
  provenance?: string;
  /** Codebook leaf ids this passage exemplifies. */
  codes: string[];
}

/** One sampled completion/answer from a model. */
export interface Sample {
  id: string;
  clusterId: string;
  text: string;
}

/**
 * A cluster of samples. `label` must be a phrase quoted from the samples
 * themselves — never a category imported by the clustering model. `code`
 * maps the cluster onto the fixed codebook so distributions are comparable
 * across models and topics.
 */
export interface Cluster {
  id: string;
  label: string;
  /** How many of the survey's draws fell here. */
  count: number;
  /** Codebook leaf id (see src/data/codebook.json). */
  code: string;
}

/** A branch of the fixed coding frame. */
export interface CodebookBranch {
  id: string;
  label: string;
  question: string;
  leaves: { id: string; label: string; definition: string }[];
}

/** The result of sampling one model N times on one topic. */
export interface Survey {
  /** e.g. "Talkie (13B, trained on text through 1930)". */
  modelLabel: string;
  /** How these samples were produced — shown to the reader. */
  methodNote: string;
  totalDraws: number;
  /** True when samples are hand-written illustrations, not model output. */
  simulated: boolean;
  clusters: Cluster[];
  samples: Sample[];
}

export interface Topic {
  id: string;
  slug: string;
  /** Short display title. */
  title: string;
  /** The question, stated plainly. */
  question: string;
  /** The period-voice completion opening actually fed to Talkie. */
  opening: string;
  band: Band;
  /** Concept tag from the question bank (WILL, LABOUR, MIND-MACHINE …). */
  axis: string;
  modern: Survey;
  period: Survey;
  passages: SourcePassage[];
  /** The historian's short reading: what is continuous, what is lost. */
  curatorialNote: string;
  /** Slug of a paired topic (e.g. the Erewhon/AGI bookend). */
  bookendWith?: string;
}

/** A topic planned for the full build, shown but not yet explorable. */
export interface PlannedTopic {
  title: string;
  band: Band;
  axis: string;
}

/** Question-bank family, following the bank's own organization. */
export type Family = "A" | "B" | "C1" | "C2";

/** One question from the 100-question bank. */
export interface Question {
  n: number;
  family: Family;
  axis: string;
  band: Band;
  text: string;
  /** For de-named items: the post-1930 referent (e.g. "digital computer"). */
  referent?: string;
  /** Predicted surprise (LOW/MED/HIGH) — a prior to be falsified, not a result. */
  surprise?: string;
  /** Slug of a worked topic page built from this question, if one exists. */
  workedTopic?: string;
}

/** Coarse verdict coded from a draw in the perspective experiment. */
export type Verdict = "mad" | "wise" | "mixed";

export interface PerspectiveDraw {
  verdict: Verdict;
  text: string;
  /** Codebook leaf ids for the positions the draw takes. */
  codes: string[];
}

/** One framing condition (unframed, as-1830, as-1930, as-2030). */
export interface PerspectiveCondition {
  id: string;
  label: string;
  prompt: string;
  talkie: PerspectiveDraw[];
  modern: PerspectiveDraw[];
}

/** The perspective-framing experiment on one question (real model outputs). */
export interface PerspectiveExperiment {
  questionN: number;
  question: string;
  protocol: string;
  conditions: PerspectiveCondition[];
}

/** One work in the 1860–1930 holdings of the historical corpus. */
export interface CorpusWork {
  year: number;
  creator: string;
  title: string;
  language: string;
  topic: string;
  url: string;
}

export interface SiteBundle {
  meta: {
    title: string;
    version: string;
    generated: string;
    note: string;
  };
  topics: Topic[];
  plannedTopics: PlannedTopic[];
}
