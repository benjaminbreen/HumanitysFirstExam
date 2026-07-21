/**
 * Data model for "Humanity's First Exam".
 *
 * The site renders from versioned JSON datasets in `src/data`. One Topic =
 * one page = one exercise in judgment: a question, a modern model's sampled
 * answers, the period distribution sampled from Talkie, and the primary
 * sources to check both against.
 */

/**
 * Temporal band of a topic, following Nathan Davies's question-bank coding:
 * - native:  a live controversy inside 1850–1940; period disagreement is signal
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

/** How the locally held source behind an admitted passage was checked. */
export type HistoricalSourceVerification =
  | "repository-text-checked"
  | "scan-checked"
  | "transcription-checked"
  | "transcription-checked-scan-pending";

/** Status of an English rendering that is not part of the primary source. */
export type TranslationReviewStatus = "not-needed" | "required" | "reviewed";

/** Known route by which an earlier text or literary form reached this source. */
export type TransmissionType =
  | "no-known-direct-dependency"
  | "explicit-response"
  | "literary-form-only"
  | "inherited-form";

/** Whether the item may provisionally enter a claim of independent convergence. */
export type IndependentConvergenceStatus =
  | "candidate"
  | "candidate-with-inherited-form"
  | "exclude-explicit-response";

/** One admitted record in the multilingual historical-passage pilot. */
export interface HistoricalPassage {
  id: string;
  sourceId: string;
  author: string;
  title: string;
  year: number;
  language: string;
  region: string;
  genre: string;
  locator: string;
  originalText: string;
  /** Null when the source itself is in English. */
  englishText: string | null;
  /** A source-led question seed, not yet a frozen instrument item. */
  questionSeed: string;
  relatedQuestionNumbers: number[];
  codes: string[];
  codebookGap: string | null;
  source: {
    url: string;
    localFile: string;
    sha256: string;
    bytes: number;
    verificationLevel: HistoricalSourceVerification;
    note: string;
  };
  translation: {
    reviewStatus: TranslationReviewStatus;
    note: string;
  };
  provenance: {
    relationship: string;
    transmissionType: TransmissionType;
    independentConvergenceStatus: IndependentConvergenceStatus;
  };
}

export interface HistoricalPassageDataset {
  meta: {
    version: string;
    status: "real-pilot";
    scope: string;
    period: { start: number; end: number };
    passageCount: number;
    sourceCount: number;
    languageCount: number;
    sourceCheckedCount: number;
    originalScanPendingCount: number;
    translationReviewRequiredCount: number;
    independentConvergenceCandidateCount: number;
    note: string;
    generatedFrom: string[];
  };
  passages: HistoricalPassage[];
}

export interface PrototypePassage {
  id: string;
  sourceId: string;
  author: string;
  title: string;
  year: number;
  language: string;
  locator: string;
  sourceUrl: string;
  originalText: string;
  englishText: string | null;
  sourceCheckRequired: boolean;
  sourceMatchLevel: string;
  classification: {
    status: "working-prototype-classification";
    themes: string[];
    claims: { claimId: string; relation: string }[];
    grounds: string[];
    autonomyEffect: string;
    genre: string;
    modes: string[];
    rationale: string;
  };
}

export interface PrototypePassageDataset {
  meta: {
    version: string;
    status: "working-prototype-classifications";
    generatedAt: string;
    model: string;
    passageCount: number;
    sourceCheckRequiredCount: number;
    note: string;
  };
  passages: PrototypePassage[];
}

export interface HistoricalSourceText {
  sourceId: string;
  passageId: string | null;
  author: string;
  title: string;
  year: number;
  language: string;
  region: string | null;
  tier: string;
  relevance: string;
  questions: number[];
  subjects: string[];
  sourceUrl: string;
  textPath: string;
  status: "repository-text" | "ocr-transcription";
  wordCount: number;
  characterCount: number;
  sha256: string;
}

export interface HistoricalSourceTextDataset {
  meta: {
    generatedFrom: string[];
    sourceCount: number;
    note: string;
  };
  sources: HistoricalSourceText[];
}

export type AnswerKeyVerdict = "frees" | "binds";
export type AttestationDecision = "admitted" | "excluded";
export type AttestationFit = "direct" | "near" | "rejected";
export type PositionEvidenceStatus = "repeated" | "singleton" | "contested";

/** A question-specific historical answer consolidated from attestations. */
export interface AnswerKeyPosition {
  id: string;
  label: string;
  verdict: AnswerKeyVerdict;
  primaryGroundId: string;
  groundFit: "direct" | "partial";
  codebookGap: string | null;
  evidenceStatus: PositionEvidenceStatus;
  attestationIds: string[];
  sourceTraditionCount: number;
}

/** A human-auditable decision about whether one passage answers one question. */
export interface AnswerKeyAttestation {
  id: string;
  sourceKind: "local-excerpt" | "historical-passage";
  historicalPassageId?: string;
  passageId: string;
  sourceId: string;
  author: string;
  title: string;
  year: number;
  language: string;
  region: string;
  genre: string;
  locator: string;
  originalText: string;
  englishText: string | null;
  textStatus:
    | "original-English"
    | "published-English-translation"
    | "working-translation-review-required";
  sourceUrl: string;
  localFile: string;
  sourceStatus: string;
  sourceVerificationLevel: string;
  translationStatus: string;
  sourceSha256: string;
  sourceBytes: number;
  provenanceRelationship: string;
  decision: AttestationDecision;
  fit: AttestationFit;
  verdict: AnswerKeyVerdict | null;
  primaryGroundId: string | null;
  positionId: string | null;
  independenceGroup: string;
  codingRationale: string;
}

/** One versioned question-level answer key and its complete candidate audit trail. */
export interface QuestionAnswerKey {
  meta: {
    keyVersion: string;
    status: "prototype-draft-for-human-review";
    benchmarkReady: boolean;
    codingStatus: string;
    methodNote: string;
    candidateAttestationCount: number;
    admittedAttestationCount: number;
    excludedAttestationCount: number;
    positionCount: number;
    sourceTraditionCount: number;
    repeatedPositionCount: number;
    singletonPositionCount: number;
    workingTranslationCount: number;
    generatedFrom: string[];
  };
  question: Pick<Question, "n" | "family" | "axis" | "band" | "text">;
  scoringRule: {
    primaryMetric: string;
    occupyingRule: string;
    weighting: string;
    additionalMetrics: string[];
  };
  positions: AnswerKeyPosition[];
  candidateAttestations: AnswerKeyAttestation[];
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
  kind: "claim" | "diagnostic";
  label: string;
  question: string;
  leaves: { id: string; label: string; definition: string }[];
}

export interface SchemaOption {
  id: string;
  label: string;
  definition: string;
}

export interface SchemaTheme extends SchemaOption {
  children: SchemaOption[];
}

export interface ClassificationSchema {
  version: string;
  name: string;
  note: string;
  themes: SchemaTheme[];
  relations: SchemaOption[];
  grounds: SchemaOption[];
  autonomyEffects: SchemaOption[];
  genres: SchemaOption[];
  modes: SchemaOption[];
  linkTypes: SchemaOption[];
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

/** Curated links from one question-bank item to specific source passages. */
export interface QuestionSourceMatchSet {
  question: number;
  /** Ordered passage ids; the first five are the compact public selection. */
  passageIds: string[];
}

export interface QuestionSourceMatchDataset {
  meta: {
    version: string;
    scope: string;
    note: string;
  };
  questions: QuestionSourceMatchSet[];
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

/** Display tone for a hand-coded verdict chip, mapped to palette tokens. */
export type VerdictTone = "continuity" | "period" | "falsecont" | "neutral";

/** One verbatim draw in a framed experiment, with a hand-coded verdict. */
export interface FramedDraw {
  id: string;
  verdict: string;
  text: string;
  flags?: string[];
  /** Working v0.2 schema tags, same shape as passage tags; not historian-verified. */
  classification?: {
    status: "working-prototype-classification";
    themes: string[];
    claims: { claimId: string; relation: string }[];
    grounds: string[];
    autonomyEffect: string;
  };
}

/** One framing condition of a framed experiment. */
export interface FramedCondition {
  id: string;
  label: string;
  prompt: string;
  talkie: FramedDraw[];
  modern: FramedDraw[];
}

/**
 * A period passage attested for one of an experiment's verdicts. Text is
 * verbatim from the project corpora; the verdict coding is provisional.
 */
export interface FramedRecordEntry {
  id: string;
  verdict: string;
  author: string;
  work: string;
  year: number;
  /** e.g. "Note G", "ch. V, 'The Automaton-Theory'". */
  locator?: string;
  text: string;
  /** Coding note where the verdict assignment needs stating. */
  note?: string;
  /** Corpus file the text was checked against. */
  source: string;
  /** Full-text page id under /sources, where one exists. */
  sourceId?: string;
  /** Working v0.2 schema tags, same shape as draw tags; not historian-verified. */
  classification?: {
    status: "working-prototype-classification";
    themes: string[];
    claims: { claimId: string; relation: string }[];
    grounds: string[];
    autonomyEffect: string;
  };
}

/**
 * A framing experiment with its own verdict vocabulary (the Erewhon test
 * predates this shape and keeps its fixed mad/wise/mixed coding).
 */
export interface FramedExperiment {
  title: string;
  /** Worked-topic page this experiment supplies real draws for, if any. */
  topicSlug?: string;
  question: string;
  protocol: string;
  verdicts: Record<string, { label: string; definition: string; tone: VerdictTone }>;
  conditions: FramedCondition[];
  /** Period passages taking each verdict, shown under the verdict table. */
  record?: FramedRecordEntry[];
  /** Editorial reading, one paragraph per entry. */
  readings: string[];
}

/** One raw draw from a live model run. Text is verbatim; flags mark defects. */
export interface LiveDraw {
  id: string;
  text: string;
  /** e.g. "prompt echo" — retained, never cleaned away. */
  flags: string[];
}

/** Real draws on one bank question from both models, with checked sources. */
export interface LiveQuestion {
  n: number;
  family: Family;
  band: Band;
  axis: string;
  title: string;
  text: string;
  talkie: LiveDraw[];
  modern: LiveDraw[];
  /** Editorial reading of what the draws show. */
  summary: string;
  curatorialNote: string;
  passages: SourcePassage[];
}

/** The ported real-output pilot: nine Talkie + nine modern draws. */
export interface LiveRuns {
  note: string;
  talkie: { modelLabel: string; date: string; provenance: string };
  modern: { modelLabel: string; date: string; provenance: string };
  questions: LiveQuestion[];
}

/** One of the four cross-bank relationship types (the hypothesis layer). */
export interface RelationType {
  id: string;
  label: string;
  definition: string;
  /** The sampling signature this type predicts — falsifiable by the draws. */
  prediction: string;
  instance: { label: string; href: string; body: string } | null;
}

/** One judged cross-bank pairing from the modern-bank pilot. */
export interface MapPair {
  modernId: string;
  modernText: string;
  theme: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
  periodN: number | null;
  periodFamily: string | null;
  periodText: string | null;
  /** Adjudicated relationship type id. */
  type: string;
  /** True when both raters agreed before adjudication. */
  agreed: boolean;
  modernQuote: string | null;
  periodQuote: string | null;
  explanation: string | null;
}

/** The pilot relationship map: 12 judged pairings plus reliability stats. */
export interface RelationshipMap {
  meta: {
    pilotId: string;
    note: string;
    rawAgreement: number;
    kappa: number;
    tally: Record<string, number>;
    continuityNote: string;
  };
  pairs: MapPair[];
}

/** The two-bank relationship-map design. */
export interface RelationshipsDoc {
  status: string;
  note: string;
  premise: string;
  pipeline: { name: string; body: string }[];
  types: RelationType[];
}

/** One work in the 1850–1940 holdings of the historical corpus. */
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
