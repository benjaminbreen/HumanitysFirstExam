import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { redis, storage } from "@/lib/coding";
import { advance, agentConfig, emptySorting, instructions, pools, validateSorting, type Coder, type Study } from "./key-model";

// One compare-and-set document makes the study's gates and approvals atomic.
// Earlier keys:* records remain untouched; human entries migrate only as drafts.
const DIR = process.env.KEYS_DATA_DIR ?? path.join(process.cwd(), "research", "keys", "entries");
const FILE = path.join(DIR, "study-v2.json");
const KEY = "keys:study:v2";
export const inputVersion = createHash("sha256").update(JSON.stringify({ instructions, pools, agentConfig })).digest("hex");
const missing = (e: unknown) => (e as NodeJS.ErrnoException).code === "ENOENT";
async function fileText(file: string) {
  try { return await readFile(file, "utf8"); } catch (e) { if (missing(e)) return ""; throw e; }
}
async function rawStudy(): Promise<string> {
  if (storage === "none") return "";
  return storage === "redis" ? (await redis(["GET", KEY])) ?? "" : fileText(FILE);
}
async function legacy(coder: Coder) {
  if (storage === "none") return {};
  if (storage === "file") return JSON.parse((await fileText(path.join(DIR, `${coder}.json`))) || "{}");
  const flat: string[] = (await redis(["HGETALL", `keys:${coder}`])) ?? [];
  const result: Record<string, unknown> = {};
  for (let i = 0; i < flat.length; i += 2) if (!flat[i].includes(":")) result[flat[i]] = JSON.parse(flat[i + 1]);
  return result;
}
async function initialStudy(): Promise<Study> {
  const sortings: Study["sortings"] = { ben: {}, nathan: {} };
  for (const coder of ["ben", "nathan"] as Coder[]) {
    const old = await legacy(coder);
    for (const p of pools) {
      const s = old[p.question];
      sortings[coder][p.question] = s ? { ...validateSorting(p.question, s), done: false, savedAt: s.savedAt ?? "", version: 0 } : emptySorting();
    }
  }
  return { schema: 2, revision: 0, inputVersion, sortings, runs: {}, rule: null, independentLockedAt: null, humanOpenedAt: null, agentsRevealedAt: null, references: {}, finals: {}, reviews: {}, decisions: {} };
}
async function decode(raw: string): Promise<Study> {
  if (!raw) return initialStudy();
  const s = JSON.parse(raw) as Study;
  if (s.schema !== 2 || s.inputVersion !== inputVersion) throw new Error("The stored study uses different inputs or agent settings. Preserve it and start a new study before changing passages, instructions or agent configurations.");
  return s;
}
export async function readStudy() { return decode(await rawStudy()); }

export const CAS_SCRIPT = `
local previous = redis.call('GET', KEYS[1]) or ''
if previous ~= ARGV[1] then return 0 end
if previous ~= '' then redis.call('LPUSH', KEYS[2], previous) end
redis.call('SET', KEYS[1], ARGV[2])
return 1
`;
async function compareAndSet(expected: string, next: Study) {
  if (storage === "none") throw new Error("Saving is not configured");
  const serialized = JSON.stringify(next);
  if (storage === "redis") return (await redis(["EVAL", CAS_SCRIPT, "2", KEY, `${KEY}:history`, expected, serialized])) === 1;
  await mkdir(DIR, { recursive: true });
  const lock = path.join(DIR, ".study-v2.lock");
  let acquired = false;
  for (let i = 0; i < 80; i++) {
    try { await mkdir(lock); acquired = true; break; }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e; await new Promise((resolve) => setTimeout(resolve, 25)); }
  }
  if (!acquired) throw new Error("Another save is in progress. Retry shortly; if the local server stopped during a save, remove its stale .study-v2.lock directory.");
  const temp = path.join(DIR, `.study-${randomUUID()}.tmp`);
  try {
    if ((await fileText(FILE)) !== expected) return false;
    if (expected) {
      await mkdir(path.join(DIR, "history"), { recursive: true });
      await writeFile(path.join(DIR, "history", `${next.revision - 1}.json`), expected + "\n");
    }
    await writeFile(temp, serialized);
    await rename(temp, FILE);
    return true;
  } finally {
    await unlink(temp).catch((e) => { if (!missing(e)) throw e; });
    await rmdir(lock);
  }
}
export async function updateStudy<T>(change: (s: Study, now: string) => T): Promise<T> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const raw = await rawStudy();
    const state = await decode(raw);
    const now = new Date().toISOString();
    const result = change(state, now);
    advance(state, now);
    state.revision++;
    if (await compareAndSet(raw, state)) return result;
  }
  throw new Error("The study changed while saving. Reload and try again.");
}
