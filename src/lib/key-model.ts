import poolsFile from "../../research/keys/pools.json";
import instructionsFile from "../../research/keys/instructions.json";
import agentConfigFile from "../../research/keys/agents.json";

export type Coder = "ben" | "nathan";
export const agentConfig = agentConfigFile;
export type Agent = keyof typeof agentConfig;
export const agents = Object.keys(agentConfig) as Agent[];
export const agentNames = Object.fromEntries(agents.map((a) => [a, `${agentConfig[a].name} (Medium)`])) as Record<Agent, string>;
export const instructions = instructionsFile;
export const MAX_POSITIONS = 15;
export type Direction = "yes" | "no" | "other";
export type PoolPassage = { id: string; work: string; author: string; title: string; year: number | null; language: string; display: string; text: string; translation: string | null };
export type Pool = { question: string; text: string; passages: PoolPassage[] };
export const pools = poolsFile as Pool[];
export const getPool = (q: string) => pools.find((p) => p.question === q);
export const directionLabels = (q: string): Record<Direction, string> => ({ yes: q === "Q18" ? "Develops" : "Yes", no: q === "Q18" ? "Diminishes" : "No", other: "Other" });
export type Category = { id: string; claim: string; reason: string; direction?: Direction | null; passages: string[]; note?: string };
export type Sorting = { categories: Category[]; off: string[]; unclear: string[]; done: boolean; savedAt: string; version: number };
export const emptySorting = (): Sorting => ({ categories: [], off: [], unclear: [], done: false, savedAt: "", version: 0 });
export type JointKind = "reference" | "final";
export type Approval = { version: number; at: string };
export type JointList = Sorting & { agreed: Partial<Record<Coder, Approval>>; frozenAt: string | null; started: boolean };
export const emptyJoint = (): JointList => ({ ...emptySorting(), agreed: {}, frozenAt: null, started: false });
export type ReferenceJudgment = { status: "recovered" | "missed" | "unresolved"; matches: string[]; note: string };
export type AgentJudgment = { status: "supported" | "unsupported" | "discovery" | "unresolved"; note: string };
export type DefinitionReview = { reference: Record<string, ReferenceJudgment>; categories: Record<string, AgentJudgment>; notes: string; version: number; agreed: Partial<Record<Coder, Approval>>; frozenAt: string | null; savedAt: string };
export const emptyReview = (): DefinitionReview => ({ reference: {}, categories: {}, notes: "", version: 0, agreed: {}, frozenAt: null, savedAt: "" });
export type AgentRun = { agent: Agent; model: string; settings: Record<string, unknown>; createdAt: string; inputVersion: string; instructionsVersion: string; independent: true; exposureNote: string; originalOutput: string; sortings: Record<string, Sorting>; receivedAt: string };
export type EvaluationRule = { text: string; version: number; recordedAt: string };
export type AgentDecision = { outcome: "use" | "revise" | "inconclusive"; reason: string; recordedAt: string };
export type Study = {
  schema: 2; revision: number; inputVersion: string;
  sortings: Record<Coder, Record<string, Sorting>>;
  runs: Partial<Record<Agent, AgentRun>>;
  rule: EvaluationRule | null;
  independentLockedAt: string | null; humanOpenedAt: string | null; agentsRevealedAt: string | null;
  references: Record<string, JointList>; finals: Record<string, JointList>;
  reviews: Record<string, Partial<Record<Agent, DefinitionReview>>>;
  decisions: Partial<Record<Agent, AgentDecision>>;
};

export function complete(q: string, s: Sorting) {
  const pool = getPool(q);
  if (!pool || !s || !Array.isArray(s.categories) || s.categories.length > MAX_POSITIONS || !Array.isArray(s.off) || !Array.isArray(s.unclear)) return false;
  const ids = new Set(pool.passages.map((p) => p.id));
  const catIds = new Set<string>();
  for (const c of s.categories) {
    if (!c || typeof c.id !== "string" || !/^[a-zA-Z0-9_-]{1,20}$/.test(c.id) || ["off", "unclear", "__proto__", "constructor", "prototype"].includes(c.id) || catIds.has(c.id) ||
      typeof c.claim !== "string" || !c.claim.trim() || typeof c.reason !== "string" || !c.reason.trim() ||
      !["yes", "no", "other"].includes(c.direction ?? "") || !Array.isArray(c.passages) || !c.passages.length) return false;
    catIds.add(c.id);
  }
  const placed = [...s.categories.flatMap((c) => c.passages), ...s.off, ...s.unclear];
  return placed.length === ids.size && new Set(placed).size === placed.length && placed.every((id) => ids.has(id));
}

// Drafts may be incomplete, but invalid/duplicate assignments are rejected, never silently repaired.
export function validateSorting(q: string, value: unknown): Sorting {
  if (!getPool(q) || !value || typeof value !== "object") throw new Error("Invalid sorting");
  const s = value as Sorting;
  if (!Array.isArray(s.categories) || s.categories.length > MAX_POSITIONS || !Array.isArray(s.off) || !Array.isArray(s.unclear)) throw new Error("Invalid positions or placements");
  const ids = new Set(getPool(q)!.passages.map((p) => p.id));
  const seen = new Set<string>(), cats = new Set<string>();
  const place = (xs: string[]) => {
    if (!Array.isArray(xs)) throw new Error("Invalid placements");
    for (const id of xs) {
      if (!ids.has(id) || seen.has(id)) throw new Error("Each known passage can be placed only once");
      seen.add(id);
    }
    return [...xs];
  };
  const categories = s.categories.map((c) => {
    if (!c || typeof c.id !== "string" || !/^[a-zA-Z0-9_-]{1,20}$/.test(c.id) || ["off", "unclear", "__proto__", "constructor", "prototype"].includes(c.id) || cats.has(c.id)) throw new Error("Position IDs must be unique");
    cats.add(c.id);
    if (typeof c.claim !== "string" || c.claim.length > 600 || typeof c.reason !== "string" || c.reason.length > 1200 || (c.note != null && (typeof c.note !== "string" || c.note.length > 1200)) || (c.direction != null && !["yes", "no", "other"].includes(c.direction))) throw new Error("Invalid position text or direction");
    return { id: c.id, claim: c.claim, reason: c.reason, direction: c.direction ?? null, passages: place(c.passages), ...(c.note ? { note: c.note } : {}) };
  });
  return { categories, off: place(s.off), unclear: place(s.unclear), done: s.done === true, savedAt: "", version: 0 };
}
export const content = (s: Sorting) => JSON.stringify([s.categories, s.off, s.unclear]);
export function allIndependentDone(s: Study) {
  return pools.every((p) => (["ben", "nathan"] as Coder[]).every((c) => s.sortings[c][p.question]?.done && complete(p.question, s.sortings[c][p.question]))) &&
    agents.every((a) => s.runs[a] && pools.every((p) => s.runs[a]!.sortings[p.question]?.done && complete(p.question, s.runs[a]!.sortings[p.question])));
}
export const jointLocked = (q: string, f?: JointList) => Boolean(f?.frozenAt && complete(q, f) && f.agreed.ben?.version === f.version && f.agreed.nathan?.version === f.version);
export const allReferencesLocked = (s: Study) => pools.every((p) => jointLocked(p.question, s.references[p.question]));
export const humansOpen = (s: Study) => Boolean(s.humanOpenedAt && s.independentLockedAt && allIndependentDone(s));
export const agentsOpen = (s: Study) => humansOpen(s) && Boolean(s.agentsRevealedAt) && allReferencesLocked(s);
export const reviewLocked = (r?: DefinitionReview) => Boolean(r?.frozenAt && r.agreed.ben?.version === r.version && r.agreed.nathan?.version === r.version);
export const reviewsLocked = (s: Study, q: string) => agents.every((a) => reviewLocked(s.reviews[q]?.[a]));
export const allReviewsLocked = (s: Study) => pools.every((p) => reviewsLocked(s, p.question));
export function advance(s: Study, now: string) {
  if (allIndependentDone(s)) s.independentLockedAt ??= now;
  if (s.independentLockedAt) s.humanOpenedAt ??= now;
  if (humansOpen(s) && allReferencesLocked(s)) s.agentsRevealedAt ??= now;
}
export function reviewCounts(q: string, reference: JointList, run: AgentRun, r: DefinitionReview) {
  const refs = reference.categories.map((c) => r.reference[c.id]?.status ?? "unresolved");
  const cats = run.sortings[q].categories.map((c) => r.categories[c.id]?.status ?? "unresolved");
  return { recovered: refs.filter((s) => s === "recovered").length, missed: refs.filter((s) => s === "missed").length, unresolved: refs.filter((s) => s === "unresolved").length, total: refs.length, unsupported: cats.filter((s) => s === "unsupported").length, discoveries: cats.filter((s) => s === "discovery").length, agentUnresolved: cats.filter((s) => s === "unresolved").length };
}
const where = (s: Sorting, id: string) => {
  const c = s.categories.find((c) => c.passages.includes(id));
  return c ? { box: c.id, dir: c.direction ?? "none" } : s.off.includes(id) ? { box: "off", dir: "off" } : null;
};
export type Tally = { together: number; either: number; same: number; n: number; left: number; offA: number; offB: number; groupingN: number; groupingOff: number; dirs: [string, string][] };
export function tally(q: string, a: Sorting, b: Sorting): Tally {
  const ids = getPool(q)!.passages.map((p) => p.id);
  const both = ids.filter((id) => where(a, id) && where(b, id));
  const group = both.filter((id) => where(a, id)!.dir !== "off" && where(b, id)!.dir !== "off");
  let together = 0, either = 0;
  for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
    const x = where(a, group[i])!.box === where(a, group[j])!.box;
    const y = where(b, group[i])!.box === where(b, group[j])!.box;
    if (x && y) together++;
    if (x || y) either++;
  }
  const dirs = both.map((id) => [where(a, id)!.dir, where(b, id)!.dir] as [string, string]);
  return { together, either, same: dirs.filter(([x, y]) => x === y).length, n: both.length, left: ids.length - both.length, offA: a.off.length, offB: b.off.length, groupingN: group.length, groupingOff: ids.filter((id) => a.off.includes(id) || b.off.includes(id)).length, dirs };
}
export const addTallies = (ts: Tally[]): Tally => ts.reduce((s, t) => ({ together: s.together + t.together, either: s.either + t.either, same: s.same + t.same, n: s.n + t.n, left: s.left + t.left, offA: s.offA + t.offA, offB: s.offB + t.offB, groupingN: s.groupingN + t.groupingN, groupingOff: s.groupingOff + t.groupingOff, dirs: [...s.dirs, ...t.dirs] }), { together: 0, either: 0, same: 0, n: 0, left: 0, offA: 0, offB: 0, groupingN: 0, groupingOff: 0, dirs: [] });
export function kappa(dirs: [string, string][]) {
  if (!dirs.length) return null;
  const n = dirs.length, po = dirs.filter(([a, b]) => a === b).length / n;
  let pe = 0;
  for (const c of new Set(dirs.flat())) pe += dirs.filter(([a]) => a === c).length / n * dirs.filter(([, b]) => b === c).length / n;
  return pe === 1 ? null : (po - pe) / (1 - pe);
}
