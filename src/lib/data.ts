import themesFile from "@data/themes.json";
import questionsFile from "@data/questions.json";
import worksFile from "@data/works.json";
import stancesFile from "@data/stances.json";
import passagesFile from "@data/passages.json";
import checkSample from "../../research/coding/sample.json";
import modelsFile from "@data/models.json";

// ---------- Types ----------

export type Direction = "machine" | "human" | "both";

export type Theme = {
  slug: string;
  order: number;
  name: string;
  question: string;
  summary: string;
  direction: Direction;
};

export type Question = {
  id: string; // Q01
  slug: string; // q01
  n: number;
  theme: string;
  question: string;
  status: string;
};

export type TextStatus = "full" | "partial" | "none" | "copyright";
export type TranslationKind = "english" | "period" | "none";

export type Work = {
  id: string;
  author: string;
  authorShort: string;
  title: string;
  originalTitle: string | null;
  otherTitles: string[];
  year: number | null;
  earlier: boolean;
  language: string;
  kind: string;
  wikidata: string | null;
  textUrl: string | null;
  text: TextStatus;
  translation: { kind: TranslationKind; note?: string; url?: string };
  questions: string[];
  selectedBy: string;
  selectedOn: string;
  suggestedBy: string;
};

export type Stance = {
  id: string;
  question: string;
  work: string;
  side: string;
  sideLabel: string;
  sideGloss: string;
  argument: string;
  where: string | null;
  confidence: "high" | "medium";
  checked: string;
  status: string;
  passage?: string; // id of the quotation chosen for this stance
  reviewCheck?: string; // the passage reviewer's doubt about the summary, if any
  reviewNote?: string;
};

export type Passage = {
  id: string;
  work: string | null;
  questions: string[];
  language: string;
  original: string;
  translation: string | null;
  terms: { original: string; english: string }[];
  notes: string;
  relevance: { verdict?: string; reason?: string };
  translationBy: string | null;
  status: string;
  selection: string;
  stance?: string;
  summaryCheck?: string;
};

export type Model = {
  id: string;
  name: string;
  maker: string;
  kind: "historical" | "base" | "instruct" | "deployed";
  cutoff: string | null;
  params: string;
  access: string;
  status: "candidate" | "planned" | "piloted" | "run";
  // core: the decided comparison; context: also run; candidate: not decided.
  role: "core" | "context" | "candidate";
  note?: string;
};

// ---------- Data ----------

export const themes = themesFile.themes as Theme[];
export const questions = questionsFile.questions as Question[];
export const works = worksFile.works as Work[];
export const stances = stancesFile.stances as Stance[];
export const passages = passagesFile.passages as Passage[];
export const models = modelsFile.models as Model[];
export const themesMeta = { version: themesFile.version, date: themesFile.date, status: themesFile.status };
export const dataMeta = { version: worksFile.version, date: worksFile.date };

const workById = new Map(works.map((w) => [w.id, w]));
const questionById = new Map(questions.map((q) => [q.id, q]));

export const getTheme = (slug: string) => themes.find((t) => t.slug === slug);
export const getQuestion = (slug: string) => questions.find((q) => q.slug === slug || q.id === slug);
export const getWork = (id: string) => workById.get(id);
export const questionById_ = (id: string) => questionById.get(id);

export const questionsForTheme = (slug: string) => questions.filter((q) => q.theme === slug);
export const themeOf = (q: Question) => getTheme(q.theme);
export const stancesForQuestion = (id: string) => stances.filter((s) => s.question === id);

// The 60 stances in the blind passage check (research/coding/PROTOCOL.md)
// are held back from public pages until both coders finish. Set to false
// then.
export const CHECK_RUNNING = true;
const heldBack = new Set(CHECK_RUNNING ? checkSample.items.map((i) => i.stance) : []);
export const isHeldBack = (s: Stance) => heldBack.has(s.id);
export const heldBackForQuestion = (id: string) => stancesForQuestion(id).filter(isHeldBack).length;
export const stancesForWork = (id: string) => stances.filter((s) => s.work === id);
export const passagesForWork = (id: string) => passages.filter((p) => !p.stance && p.work === id);
// Passages not tied to one stance (the passage-translation test).
export const passagesForQuestion = (id: string) => passages.filter((p) => !p.stance && p.questions.includes(id));
const passageById = new Map(passages.map((p) => [p.id, p]));
export const quoteFor = (s: Stance) => (s.passage ? passageById.get(s.passage) : undefined);

export function worksForQuestion(id: string): Work[] {
  return stancesForQuestion(id)
    .map((s) => workById.get(s.work))
    .filter((w): w is Work => Boolean(w));
}

export type Side = { key: string; label: string; stances: (Stance & { w: Work })[] };

// Sides in reading order: yes, no, then the rest by size.
export function sidesForQuestion(id: string): Side[] {
  const bySide = new Map<string, Side>();
  for (const s of stancesForQuestion(id)) {
    if (isHeldBack(s)) continue;
    const w = workById.get(s.work);
    if (!w) continue;
    const side = bySide.get(s.side) ?? { key: s.side, label: s.sideLabel, stances: [] };
    side.stances.push({ ...s, w });
    bySide.set(s.side, side);
  }
  const rank = (k: string) => (k === "yes" ? 0 : k === "no" ? 1 : 2);
  for (const side of bySide.values()) side.stances.sort((a, b) => (a.w.year ?? 0) - (b.w.year ?? 0));
  return [...bySide.values()].sort((a, b) => rank(a.key) - rank(b.key) || b.stances.length - a.stances.length);
}

// ---------- Stats ----------

export type Stats = {
  first: Work | undefined;
  last: Work | undefined;
  workCount: number;
  questionCount: number;
  languages: string[];
  authors: string[];
};

function statsOf(ws: Work[], questionCount: number): Stats {
  const uniq = [...new Map(ws.map((w) => [w.id, w])).values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  return {
    first: uniq[0],
    last: uniq[uniq.length - 1],
    workCount: uniq.length,
    questionCount,
    languages: [...new Set(uniq.map((w) => w.language))],
    authors: [...new Set(uniq.map((w) => w.authorShort))],
  };
}

export function themeWorks(theme: Theme): Work[] {
  const ws = questionsForTheme(theme.slug).flatMap((q) => worksForQuestion(q.id));
  return [...new Map(ws.map((w) => [w.id, w])).values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
}

export const themeStats = (theme: Theme) => statsOf(themeWorks(theme), questionsForTheme(theme.slug).length);
export const questionStats = (q: Question) => statsOf(worksForQuestion(q.id), 1);

export function formatYear(year: number | null, approximate = false) {
  if (year === null || year === undefined) return "—";
  const base = year <= 0 ? `${-year} BCE` : year < 100 ? `${year} CE` : `${year}`;
  return approximate || year < 1500 ? `c. ${base}` : base;
}

export function span(stats: Stats) {
  if (!stats.first || !stats.last) return "—";
  return `${formatYear(stats.first.year)}–${formatYear(stats.last.year)}`;
}

export const directionLabel: Record<Direction, string> = {
  machine: "Humanlike machines",
  human: "Machine-like humans",
  both: "Both",
};

export const textLabel: Record<TextStatus, string> = {
  full: "Full text",
  partial: "Partial text",
  none: "No text yet",
  copyright: "In copyright",
};

export const translationLabel: Record<TranslationKind, string> = {
  english: "English original",
  period: "Period translation",
  none: "No English translation",
};

// ---------- Theme sorts (index page) ----------

export const themeSorts = {
  order: { label: "Default", compare: (a: Theme, b: Theme) => a.order - b.order },
  name: { label: "A–Z", compare: (a: Theme, b: Theme) => a.name.localeCompare(b.name) },
  earliest: {
    label: "Earliest",
    compare: (a: Theme, b: Theme) =>
      (themeStats(a).first?.year ?? 9999) - (themeStats(b).first?.year ?? 9999) || a.order - b.order,
  },
  works: {
    label: "Works",
    compare: (a: Theme, b: Theme) => themeStats(b).workCount - themeStats(a).workCount || a.order - b.order,
  },
  languages: {
    label: "Languages",
    compare: (a: Theme, b: Theme) =>
      themeStats(b).languages.length - themeStats(a).languages.length || a.order - b.order,
  },
  direction: {
    label: "Direction",
    compare: (a: Theme, b: Theme) => a.direction.localeCompare(b.direction) || a.order - b.order,
  },
} as const;

export type ThemeSort = keyof typeof themeSorts;
export const isThemeSort = (v: unknown): v is ThemeSort => typeof v === "string" && v in themeSorts;

// ---------- Short names (legacy trial pages) ----------

export const shortName = (author: string) => author.split(" ").at(-1)!;

// ---------- Sources index ----------

export const centuryOf = (w: Work) =>
  w.year === null ? "Undated" : w.year < 1600 ? "Before 1600" : `${Math.floor(w.year / 100) + 1}th c.`;

export const kindLabel = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

export const workSorts = {
  year: (a: Work, b: Work) => (a.year ?? 0) - (b.year ?? 0) || a.id.localeCompare(b.id),
  author: (a: Work, b: Work) => a.authorShort.localeCompare(b.authorShort) || (a.year ?? 0) - (b.year ?? 0),
  title: (a: Work, b: Work) => a.title.localeCompare(b.title),
  language: (a: Work, b: Work) => a.language.localeCompare(b.language) || (a.year ?? 0) - (b.year ?? 0),
  questions: (a: Work, b: Work) => b.questions.length - a.questions.length || (a.year ?? 0) - (b.year ?? 0),
} as const;

export type WorkSort = keyof typeof workSorts;
export const isWorkSort = (v: unknown): v is WorkSort => typeof v === "string" && v in workSorts;
