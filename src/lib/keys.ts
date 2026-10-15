import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import claudeFile from "../../research/keys/claude.json";
import poolsFile from "../../research/keys/pools.json";
import { redis, storage, type Coder } from "@/lib/coding";

// Building the position keys for the pilot questions. Each reader reads a
// question's pool of passages and writes the distinct arguments they find
// (claim, reason, supporting passages). Claude does the same separately; the
// two are compared argument by argument and reconciled into the key.

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
export type Category = { id: string; claim: string; reason: string; direction?: Direction | null; passages: string[] };
export type Sorting = {
  categories: Category[];
  off: string[]; // passages that do not address the question
  unclear: string[];
  done: boolean;
  savedAt: string;
};
export const emptySorting = (): Sorting => ({ categories: [], off: [], unclear: [], done: false, savedAt: "" });

export type Decision = "same" | "distinct" | "merge" | "keep" | "drop";
export type Reconciliation = Record<string, { decision: Decision | null; note: string }>; // keyed by row id

const DIR = path.join(process.cwd(), "research", "keys", "entries");

async function readAll(coder: Coder): Promise<Record<string, string>> {
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

async function write(coder: Coder, field: string, value: unknown) {
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

export async function saveSorting(coder: Coder, q: string, s: Sorting) {
  const ids = new Set(getPool(q)?.passages.map((p) => p.id));
  const clean = (xs: string[]) => [...new Set(xs.filter((x) => ids.has(x)))];
  const tidy: Sorting = {
    categories: s.categories.slice(0, 40).map((c) => ({
      id: String(c.id).slice(0, 20),
      claim: String(c.claim ?? "").slice(0, 600),
      reason: String(c.reason ?? "").slice(0, 1200),
      direction: (["yes", "no", "other"] as const).find((d) => d === c.direction) ?? null,
      passages: clean(c.passages ?? []),
    })),
    off: clean(s.off ?? []),
    unclear: clean(s.unclear ?? []),
    done: Boolean(s.done),
    savedAt: new Date().toISOString(),
  };
  await write(coder, q, tidy);
  return tidy;
}

export async function reconciliationFor(coder: Coder, q: string): Promise<Reconciliation> {
  const v = (await readAll(coder))[`${q}:reconcile`];
  return v ? JSON.parse(v) : {};
}

export async function saveReconciliation(coder: Coder, q: string, r: Reconciliation) {
  await write(coder, `${q}:reconcile`, r);
}

// ---------- Claude's draft ----------
// Written separately from the same pool (research/keys/claude.json) and shown
// to a reader only after they mark their own sorting done.

export const claudeKeys = claudeFile as Record<string, { categories: Category[]; off: string[]; unclear: string[] }>;

// ---------- comparison ----------
// Rows pair a reader's argument with Claude's. Shared passages only suggest a
// pairing; the reader decides whether the two are the same argument.

export type Row = { id: string; mine: Category | null; claude: Category | null; shared: string[] };

export function pairRows(mine: Category[], claude: Category[]): Row[] {
  const used = new Set<string>();
  const rows: Row[] = [];
  for (const m of mine) {
    let best: Category | null = null;
    let bestScore = 0;
    for (const c of claude) {
      if (used.has(c.id)) continue;
      const shared = m.passages.filter((p) => c.passages.includes(p)).length;
      const score = shared / (new Set([...m.passages, ...c.passages]).size || 1);
      if (shared > 0 && score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    if (best) used.add(best.id);
    rows.push({ id: `${m.id}~${best?.id ?? ""}`, mine: m, claude: best, shared: best ? m.passages.filter((p) => best!.passages.includes(p)) : [] });
  }
  for (const c of claude) if (!used.has(c.id)) rows.push({ id: `~${c.id}`, mine: null, claude: c, shared: [] });
  return rows;
}

// Passages both readers used, but under arguments the pairing did not match.
export function splitPassages(rows: Row[]) {
  const where = (side: "mine" | "claude") => {
    const m = new Map<string, string[]>();
    for (const r of rows) for (const p of r[side]?.passages ?? []) m.set(p, [...(m.get(p) ?? []), r.id]);
    return m;
  };
  const a = where("mine");
  const b = where("claude");
  return [...a.keys()].filter((p) => b.has(p) && !a.get(p)!.some((r) => b.get(p)!.includes(r)));
}
