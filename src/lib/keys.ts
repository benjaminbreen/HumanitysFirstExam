import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import claudeFile from "../../research/keys/claude.json";
import poolsFile from "../../research/keys/pools.json";
import { redis, storage, type Coder } from "@/lib/coding";

// Building the position keys for the pilot questions. Ben, Nathan and Claude
// each sort a question's pool of passages into positions (implied answer,
// argument, direction), separately. When both historians finish, agreement
// between each pair is measured, and Ben and Nathan merge their two lists
// into the final list that the site shows. See research/keys/PROCEDURE.md.

export type PoolPassage = {
  id: string; // "p01"…, stable within a question
  work: string;
  author: string;
  title: string;
  year: number | null;
  language: string;
  display: string; // OCR-cleaned excerpt shown to readers
  text: string; // verbatim excerpt from the source file
  translation: string | null;
};
export type Pool = { question: string; text: string; passages: PoolPassage[] };
export const pools = poolsFile as Pool[];
export const getPool = (q: string) => pools.find((p) => p.question === q);

export type Direction = "yes" | "no" | "other";
// Either/or questions get their own words for the two directions.
const POLES: Record<string, [string, string]> = { Q18: ["Develops", "Diminishes"] };
export const directionLabels = (q: string): Record<Direction, string> => {
  const [y, n] = POLES[q] ?? ["Yes", "No"];
  return { yes: y, no: n, other: "Other" };
};
export type Category = { id: string; claim: string; reason: string; direction?: Direction | null; passages: string[]; note?: string };
export type Sorting = {
  categories: Category[];
  off: string[]; // passages that do not address the question
  unclear: string[];
  done: boolean;
  savedAt: string;
};
export const emptySorting = (): Sorting => ({ categories: [], off: [], unclear: [], done: false, savedAt: "" });

// Each sorter places every passage in exactly one position, or off the
// question, or unclear. At most MAX_POSITIONS positions per question.
export const MAX_POSITIONS = 15;
export type Final = Sorting & { agreed: Partial<Record<Coder, string>>; frozenAt: string | null };

const DIR = path.join(process.cwd(), "research", "keys", "entries");

async function readAll(coder: Coder | "final"): Promise<Record<string, string>> {
  if (storage === "redis") {
    const flat: string[] = (await redis(["HGETALL", `keys:${coder}`])) ?? [];
    const out: Record<string, string> = {};
    for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
    return out;
  }
  if (storage === "none") return {};
  try {
    const raw = JSON.parse(await readFile(path.join(DIR, `${coder}.json`), "utf8"));
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, JSON.stringify(v)]));
  } catch {
    return {};
  }
}

async function write(coder: Coder | "final", field: string, value: unknown) {
  if (storage === "none") throw new Error("No storage configured");
  if (storage === "redis") {
    await redis(["HSET", `keys:${coder}`, field, JSON.stringify(value)]);
    return;
  }
  const all = Object.fromEntries(Object.entries(await readAll(coder)).map(([k, v]) => [k, JSON.parse(v)]));
  all[field] = value;
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${coder}.json`), JSON.stringify(all, null, 1) + "\n");
}

export async function sortingsFor(coder: Coder): Promise<Record<string, Sorting>> {
  const all = await readAll(coder);
  return Object.fromEntries(
    Object.entries(all)
      .filter(([k]) => !k.includes(":"))
      .map(([k, v]) => [k, JSON.parse(v) as Sorting]),
  );
}

export async function sortingFor(coder: Coder, q: string): Promise<Sorting> {
  return (await sortingsFor(coder))[q] ?? emptySorting();
}

export function tidySorting(q: string, s: Sorting): Sorting {
  const ids = new Set(getPool(q)?.passages.map((p) => p.id));
  const seen = new Set<string>();
  // A passage goes in one place only: the first one listed wins.
  const once = (xs: string[]) => [...new Set((xs ?? []).filter((x) => ids.has(x) && !seen.has(x)))].map((x) => (seen.add(x), x));
  return {
    categories: (s.categories ?? []).slice(0, MAX_POSITIONS).map((c) => ({
      id: String(c.id).slice(0, 20),
      claim: String(c.claim ?? "").slice(0, 600),
      reason: String(c.reason ?? "").slice(0, 1200),
      direction: (["yes", "no", "other"] as const).find((d) => d === c.direction) ?? null,
      passages: once(c.passages),
      ...(c.note ? { note: String(c.note).slice(0, 1200) } : {}),
    })),
    off: once(s.off),
    unclear: once(s.unclear),
    done: Boolean(s.done),
    savedAt: new Date().toISOString(),
  };
}

// Finished means every passage placed and every position given a direction.
export function complete(q: string, s: Sorting) {
  const placed = new Set([...s.categories.flatMap((c) => c.passages), ...s.off, ...s.unclear]);
  return (getPool(q)?.passages ?? []).every((p) => placed.has(p.id)) && s.categories.every((c) => c.direction && c.passages.length);
}

export async function saveSorting(coder: Coder, q: string, s: Sorting) {
  if (await bothDone(q)) throw new Error("Locked: both historians have finished this question");
  const tidy = tidySorting(q, s);
  if (tidy.done && !complete(q, tidy)) tidy.done = false;
  await write(coder, q, tidy);
  return tidy;
}

// Once Ben and Nathan have both finished a question, their sortings are
// locked and the agreement figures and the final list open.
export async function bothDone(q: string) {
  const [b, n] = await Promise.all([sortingFor("ben", q), sortingFor("nathan", q)]);
  return b.done && n.done;
}

// ---------- the final list ----------
// Ben and Nathan merge their lists into one, which readers of the site see.
// It is frozen when both have agreed to the current version.

export const emptyFinal = (): Final => ({ ...emptySorting(), agreed: {}, frozenAt: null });

export async function finalFor(q: string): Promise<Final> {
  const v = (await readAll("final"))[q];
  return v ? { ...emptyFinal(), ...JSON.parse(v) } : emptyFinal();
}

export async function saveFinal(q: string, s: Sorting) {
  const old = await finalFor(q);
  if (old.frozenAt) throw new Error("The final list is frozen");
  const tidy = tidySorting(q, s);
  const same = JSON.stringify([tidy.categories, tidy.off, tidy.unclear]) === JSON.stringify([old.categories, old.off, old.unclear]);
  const next: Final = { ...tidy, done: false, agreed: same ? old.agreed : {}, frozenAt: null };
  await write("final", q, next);
  return next;
}

export async function agreeFinal(coder: Coder, q: string, yes: boolean) {
  const f = await finalFor(q);
  if (f.frozenAt) return f;
  const agreed = { ...f.agreed };
  if (yes) agreed[coder] = new Date().toISOString();
  else delete agreed[coder];
  const frozenAt = complete(q, f) && agreed.ben && agreed.nathan ? new Date().toISOString() : null;
  const next = { ...f, agreed, frozenAt };
  await write("final", q, next);
  return next;
}

// ---------- Claude's draft ----------
// Written separately from the same pool (research/keys/claude.json) and shown
// only once both historians have finished the question.

export const claudeKeys = claudeFile as Record<string, { categories: Category[]; off: string[]; unclear: string[] }>;
export const claudeSorting = (q: string): Sorting => ({ ...emptySorting(), ...claudeKeys[q], done: Boolean(claudeKeys[q]) });

// ---------- agreement ----------
// Two measures for a pair of sorters, over passages both placed (unclear
// passages are left out). Grouping: of the pairs of passages that either
// sorter put in the same position, how many both did. Direction: how often
// both gave a passage the same direction (off the question counts as one),
// with Cohen's kappa.

const where = (s: Sorting, pid: string) => {
  const c = s.categories.find((c) => c.passages.includes(pid));
  if (c) return { box: c.id, dir: c.direction ?? "none" };
  if (s.off.includes(pid)) return { box: "off", dir: "off" };
  return null; // unclear or not placed
};

export type Tally = { together: number; either: number; same: number; n: number; left: number; dirs: [string, string][] };

export function tally(q: string, a: Sorting, b: Sorting): Tally {
  const ids = (getPool(q)?.passages ?? []).map((p) => p.id);
  const both = ids.filter((p) => where(a, p) && where(b, p));
  let together = 0, either = 0;
  for (let i = 0; i < both.length; i++)
    for (let j = i + 1; j < both.length; j++) {
      const x = where(a, both[i])!.box === where(a, both[j])!.box;
      const y = where(b, both[i])!.box === where(b, both[j])!.box;
      if (x && y) together++;
      if (x || y) either++;
    }
  const dirs = both.map((p) => [where(a, p)!.dir, where(b, p)!.dir] as [string, string]);
  return { together, either, same: dirs.filter(([x, y]) => x === y).length, n: both.length, left: ids.length - both.length, dirs };
}

export function addTallies(ts: Tally[]): Tally {
  return ts.reduce((s, t) => ({ together: s.together + t.together, either: s.either + t.either, same: s.same + t.same, n: s.n + t.n, left: s.left + t.left, dirs: [...s.dirs, ...t.dirs] }), { together: 0, either: 0, same: 0, n: 0, left: 0, dirs: [] });
}

export function kappa(dirs: [string, string][]) {
  const n = dirs.length;
  if (!n) return null;
  const po = dirs.filter(([x, y]) => x === y).length / n;
  const cats = new Set(dirs.flat());
  let pe = 0;
  for (const c of cats) pe += (dirs.filter(([x]) => x === c).length / n) * (dirs.filter(([, y]) => y === c).length / n);
  return pe === 1 ? null : (po - pe) / (1 - pe);
}
