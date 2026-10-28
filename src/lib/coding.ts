import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import sampleFile from "../../research/coding/sample.json";

// Blind coding of a stance sample (research/coding/PROTOCOL.md).
// Storage: Upstash Redis when its REST credentials are set (hosted), else one
// JSON file per coder in research/coding/entries/ (local; commit the files).
// Keys and files are prefixed "check" so entries made under the earlier
// protocol (keys "coding:<coder>") are left untouched.

export const coders = { ben: "Ben Breen", nathan: "Nathan Davies" } as const;
export type Coder = keyof typeof coders;
export const isCoder = (v: unknown): v is Coder => typeof v === "string" && v in coders;

export type SamplePassage = { file: string; chunk: number; before: string; text: string; after: string };
export type SampleItem = {
  item: string;
  stance: string;
  question: string;
  work: string;
  textLanguage: string;
  passages: SamplePassage[];
};
export const sample = sampleFile as { drawn: string; seed: number; n: number; method: string; items: SampleItem[] };
export const getItem = (id: string) => sample.items.find((i) => i.item === id);

// "none": the quotation takes no position on the question. "cannot": no
// quotation was found and the coder cannot answer from knowledge of the work.
export const SIDES = ["yes", "no", "other", "none", "cannot"] as const;
export type Side = (typeof SIDES)[number];
export type Answer = { side: Side | null; note: string };
export type Entry = Answer & { item: string; coder: Coder; savedAt: string; revisions: (Answer & { savedAt: string })[] };

// ---------- storage ----------

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const DIR = path.join(process.cwd(), "research", "coding", "entries");

export const storage = redisUrl && redisToken ? "redis" : process.env.VERCEL ? "none" : "file";

export async function redis(cmd: string[]) {
  const r = await fetch(redisUrl!, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}` },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  const body = await r.json();
  if (body.error) throw new Error(`Redis command failed: ${body.error}`);
  return body.result;
}

export async function entriesFor(coder: Coder): Promise<Record<string, Entry>> {
  if (storage === "redis") {
    const flat: string[] = (await redis(["HGETALL", `check:${coder}`])) ?? [];
    const out: Record<string, Entry> = {};
    for (let i = 0; i < flat.length; i += 2) out[flat[i]] = JSON.parse(flat[i + 1]);
    return out;
  }
  if (storage === "none") return {};
  try {
    return JSON.parse(await readFile(path.join(DIR, `check-${coder}.json`), "utf8"));
  } catch {
    return {};
  }
}

export async function saveEntry(coder: Coder, item: string, change: Partial<Answer>) {
  if (storage === "none") throw new Error("No storage configured");
  const all = await entriesFor(coder);
  const prev = all[item];
  const answer: Answer = { side: prev?.side ?? null, note: prev?.note ?? "", ...change };
  const savedAt = new Date().toISOString();
  // Earlier versions are kept, never overwritten.
  const entry: Entry = {
    ...answer,
    item,
    coder,
    savedAt,
    revisions: prev ? [...prev.revisions, { ...pick(prev), savedAt: prev.savedAt }] : [],
  };
  if (storage === "redis") {
    await redis(["HSET", `check:${coder}`, item, JSON.stringify(entry)]);
    return;
  }
  all[item] = entry;
  await mkdir(DIR, { recursive: true });
  const sorted = Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(path.join(DIR, `check-${coder}.json`), JSON.stringify(sorted, null, 1) + "\n");
}

const pick = (e: Answer): Answer => ({ side: e.side, note: e.note });

// ---------- sign-in ----------
// Passcodes come from CODING_PASSCODE_BEN / CODING_PASSCODE_NATHAN. Running
// locally without them, no passcode is asked for.

const passcode = (c: Coder) => process.env[`CODING_PASSCODE_${c.toUpperCase()}`] ?? "";
export const needsPasscode = storage !== "file" || Boolean(passcode("ben") || passcode("nathan"));
const sign = (c: Coder) =>
  createHash("sha256").update(`${c}|${passcode(c)}|${process.env.CODING_SECRET ?? "hfe"}`).digest("hex").slice(0, 32);

export const checkPasscode = (c: Coder, given: string) => !needsPasscode || (passcode(c) !== "" && given === passcode(c));
export const cookieValue = (c: Coder) => `${c}.${sign(c)}`;

export async function currentCoder(): Promise<Coder | null> {
  const v = (await cookies()).get("coder")?.value ?? "";
  const [c, sig] = v.split(".");
  return isCoder(c) && sig === sign(c) ? c : null;
}

// ---------- progress ----------

export async function progress() {
  const [ben, nathan] = await Promise.all([entriesFor("ben"), entriesFor("nathan")]);
  const done = (e: Record<string, Entry>) => sample.items.filter((i) => e[i.item]?.side).length;
  return { ben: done(ben), nathan: done(nathan), total: sample.items.length, entries: { ben, nathan } };
}
