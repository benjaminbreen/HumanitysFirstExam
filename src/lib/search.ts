import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { execFileSync } from "node:child_process";
import worksFile from "@data/works.json";

// Semantic search over the corpora built in trial/corpus/. Locally it reads
// the full index (trial/corpus/index, 1.8 GB, not deployed). Deployed, it
// reads search-index/: the canon only, its passages gzipped and held in
// memory. Both are written by trial/corpus/build_index.py.

// cwd is called indirectly so the bundler does not trace these folders (trial/
// holds a Python virtualenv and 1.8 GB of index). search-index/ is bundled
// through outputFileTracingIncludes in next.config.ts instead.
const cwd: () => string = process.cwd;
const LOCAL = path.join(cwd(), "trial", "corpus", "index");
const DEPLOYED = path.join(cwd(), "search-index");
const dir = () => (fs.existsSync(path.join(LOCAL, "manifest.json")) ? LOCAL : DEPLOYED);

export type CorpusInfo = { id: string; label: string; count: number; dims: number; default?: boolean };
export type Hit = {
  corpus: string;
  score: number;
  source: string;
  year: number | null;
  state?: string | null;
  work?: string;
  text: string;
  match?: string;
};

type Loaded = {
  info: CorpusInfo;
  vec: Int8Array;
  yr: Int16Array;
  // Uncompressed corpora are read row by row from disk; gzipped ones are held
  // in memory, one line per passage.
  off?: BigUint64Array;
  fd?: number;
  lines?: string[];
};

const cache = globalThis as unknown as { __hfeSearch?: Map<string, Loaded>; __hfeQ?: Map<string, Float32Array> };

export function searchAvailable() {
  return fs.existsSync(path.join(dir(), "manifest.json"));
}

export function corpora(): CorpusInfo[] {
  if (!searchAvailable()) return [];
  return JSON.parse(fs.readFileSync(path.join(dir(), "manifest.json"), "utf8")).corpora;
}

function load(info: CorpusInfo): Loaded {
  cache.__hfeSearch ??= new Map();
  const hit = cache.__hfeSearch.get(info.id);
  if (hit) return hit;
  const file = (ext: string) => path.join(dir(), `${info.id}.${ext}`);
  const v = fs.readFileSync(file("i8"));
  const y = fs.readFileSync(file("yr"));
  const loaded: Loaded = {
    info,
    vec: new Int8Array(v.buffer, v.byteOffset, v.byteLength),
    yr: new Int16Array(y.buffer.slice(y.byteOffset, y.byteOffset + y.byteLength)),
  };
  if (fs.existsSync(file("jsonl"))) {
    const o = fs.readFileSync(file("off"));
    loaded.off = new BigUint64Array(o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength));
    loaded.fd = fs.openSync(file("jsonl"), "r");
  } else {
    loaded.lines = gunzipSync(fs.readFileSync(file("jsonl.gz"))).toString("utf8").split("\n");
  }
  cache.__hfeSearch.set(info.id, loaded);
  return loaded;
}

// One 1536-dim embedding per query; shorter corpora use its first `dims`
// values renormalized, which is how text-embedding-3 shortening works.
async function embed(q: string): Promise<Float32Array> {
  cache.__hfeQ ??= new Map();
  const c = cache.__hfeQ.get(q);
  if (c) return c;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: q }),
  });
  if (!res.ok) throw new Error(`Embedding request failed (${res.status})`);
  const v = Float32Array.from((await res.json()).data[0].embedding as number[]);
  cache.__hfeQ.set(q, v);
  return v;
}

function forDims(full: Float32Array, dims: number) {
  const v = full.slice(0, dims);
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n);
  for (let i = 0; i < v.length; i++) v[i] /= n * 127; // fold the int8 scale in
  return v;
}

function readRow(c: Loaded, i: number) {
  if (c.lines) return JSON.parse(c.lines[i]);
  const start = Number(c.off![i]);
  const end = i + 1 < c.off!.length ? Number(c.off![i + 1]) : fs.fstatSync(c.fd!).size;
  const b = Buffer.alloc(end - start);
  fs.readSync(c.fd!, b, 0, b.length, start);
  return JSON.parse(b.toString("utf8"));
}

// A short "X and Y" query asks for the intersection, not merely either topic.
// Longer prose remains a single semantic query.
function facets(q: string): [string, string] | null {
  const parts = q.split(/\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
  return parts.length === 2 && parts.every((s) => s.split(/\s+/).length <= 5)
    ? [parts[0], parts[1]] : null;
}

function mention(text: string, phrase: string) {
  const words = phrase.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return false;
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
  return (` ${normalized} `).includes(` ${words.join(" ")} `);
}

export function entityQuery(q: string) {
  const match = q.match(/^[“"]([^”"]+)[”"]\s+(?:and\s+)?(.+)$/i);
  if (match) return { entity: match[1].trim(), topic: match[2].trim() };
  const author = [...new Set(worksFile.works.map((w) => w.author))]
    .sort((a, b) => b.length - a.length)
    .find((name) => q.toLowerCase().startsWith(`${name.toLowerCase()} `));
  if (!author) return null;
  const topic = q.slice(author.length).trim().replace(/^and\s+/i, "");
  return topic ? { entity: author, topic } : null;
}

// Rows whose line contains `literal`, case-insensitively.
function matchingLines(c: Loaded, literal: string): Set<number> {
  if (c.lines) {
    const needle = literal.toLowerCase();
    const out = new Set<number>();
    c.lines.forEach((line, i) => line.toLowerCase().includes(needle) && out.add(i));
    return out;
  }
  const file = path.join(dir(), `${c.info.id}.jsonl`);
  try {
    const output = execFileSync("rg", ["-n", "-i", "-F", "-o", literal, file], {
      encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
    });
    return new Set(output.split("\n").filter(Boolean).map((line) => Number(line.slice(0, line.indexOf(":"))) - 1));
  } catch (error) {
    // ripgrep uses exit code 1 when there are no matches.
    if (typeof error === "object" && error !== null && "status" in error && error.status === 1) return new Set();
    throw error;
  }
}

function authorSources(entity: string): Set<string> {
  const names = new Set(worksFile.works
    .filter((w) => w.author.toLowerCase() === entity.toLowerCase())
    .map((w) => w.authorShort));
  return new Set([...names]
    .filter((name) => worksFile.works.every((w) => w.authorShort !== name || w.author.toLowerCase() === entity.toLowerCase()))
    .map((name) => `${name}, `));
}

export async function search(opts: {
  q: string;
  corpora: string[];
  from?: number;
  to?: number;
  k?: number;
}): Promise<{ hits: Hit[]; scanned: number; ms: number }> {
  const t0 = Date.now();
  const k = opts.k ?? 30;
  const quoted = entityQuery(opts.q);
  if (quoted) {
    const query = forDims(await embed(quoted.topic), 1536);
    const author = authorSources(quoted.entity);
    const hits: Hit[] = [];
    let scanned = 0;
    for (const info of corpora().filter((c) => opts.corpora.includes(c.id))) {
      const c = load(info);
      const lines = matchingLines(c, quoted.entity);
      if (info.id === "canon") {
        for (const source of author) {
          for (const i of matchingLines(c, `"source": "${source}`)) lines.add(i);
        }
      }
      const q = info.dims === 1536 ? query : forDims(query, info.dims);
      for (const i of lines) {
        const y = c.yr[i];
        if (y && ((opts.from && y < opts.from) || (opts.to && y > opts.to))) continue;
        const row = readRow(c, i);
        const inText = mention(row.text, quoted.entity);
        const byAuthor = info.id === "canon" && [...author].some((prefix) => row.source.startsWith(prefix));
        if (!inText && !byAuthor && !mention(row.source, quoted.entity)) continue;
        scanned++;
        let score = 0;
        const base = i * info.dims;
        for (let j = 0; j < info.dims; j++) score += q[j] * c.vec[base + j];
        const directTopic = mention(row.text, quoted.topic);
        hits.push({ corpus: info.id, score: score + (directTopic ? 0.2 : 0),
          source: row.source, year: row.year, state: row.state, work: row.work, text: row.text,
          match: `${byAuthor ? "By " : "Mentions "}${quoted.entity}${directTopic ? ` · mentions ${quoted.topic}` : " · topic matched by meaning"}` });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return { hits: hits.slice(0, k), scanned, ms: Date.now() - t0 };
  }
  const pair = facets(opts.q);
  const embeddings = await Promise.all([opts.q, ...(pair ?? [])].map(embed));
  const candidates = pair ? 300 : k;
  const top: { s: number; raw: number; c: Loaded; i: number }[] = [];
  let floor = -Infinity;
  let scanned = 0;
  for (const info of corpora().filter((c) => opts.corpora.includes(c.id))) {
    const c = load(info);
    const n = c.yr.length;
    const DIMS = info.dims;
    const vectors = embeddings.map((v) => forDims(v, DIMS));
    for (let i = 0; i < n; i++) {
      const y = c.yr[i];
      if (y && ((opts.from && y < opts.from) || (opts.to && y > opts.to))) continue;
      scanned++;
      const scores = vectors.map(() => 0);
      const base = i * DIMS;
      for (let j = 0; j < DIMS; j++) {
        const value = c.vec[base + j];
        for (let f = 0; f < vectors.length; f++) scores[f] += vectors[f][j] * value;
      }
      const s = pair
        ? 0.25 * scores[0] + 0.75 * Math.min(scores[1], scores[2])
        : scores[0];
      if (top.length < candidates || s > floor) {
        top.push({ s, raw: scores[0], c, i });
        if (top.length > candidates) {
          top.sort((a, b) => b.s - a.s);
          top.length = candidates;
        }
        floor = top.length === candidates ? Math.min(...top.map((t) => t.s)) : -Infinity;
      }
    }
  }
  top.sort((a, b) => b.s - a.s);
  const hits = top.map(({ s, raw, c, i }) => {
    const row = readRow(c, i);
    const named = pair && (mention(row.text, pair[0]) || mention(row.source, pair[0]));
    const topical = pair && mention(row.text, pair[1]);
    return {
      corpus: c.info.id, score: pair ? s + (named ? 0.06 : 0) + (topical ? 0.03 : 0) : raw,
      source: row.source, year: row.year, state: row.state, work: row.work, text: row.text,
      match: pair ? named ? "Name appears in passage or source" : "Semantic connection to both terms" : undefined,
    };
  }).sort((a, b) => b.score - a.score).slice(0, k);
  return { hits, scanned, ms: Date.now() - t0 };
}
