#!/usr/bin/env node

// Candidate retrieval only: embeddings narrow the review set; they do not label evidence.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const root = new URL("../", import.meta.url);
const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
const cap = Number(process.env.MAX_EMBEDDING_USD ?? "1");
const price = 0.02; // conservative prototype estimate, USD / million tokens
const topK = Number(process.env.TOP_K ?? "10");
const maxChunks = Number(process.env.MAX_CHUNKS ?? "2000");
const chunkWords = 450;
const overlap = 75;

const parseEnv = (s) => Object.fromEntries(s.split(/\r?\n/).map(x => x.trim()).filter(x => x && !x.startsWith("#") && x.includes("=")).map(x => { const i=x.indexOf("="); return [x.slice(0,i), x.slice(i+1).replace(/^['"]|['"]$/g, "")]; }));
const env = parseEnv(await readFile(new URL("local.env", root), "utf8").catch(() => readFile(new URL(".env.local", root), "utf8").catch(() => "")));
const key = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY;
if (!key) throw new Error("OPENAI_API_KEY not found in local.env or environment");
const questions = JSON.parse(await readFile(new URL("src/data/question_bank.json", root), "utf8"));
const sources = JSON.parse(await readFile(new URL("src/data/historical_source_texts.json", root), "utf8")).sources;
const chunks = [];
for (const source of sources) {
  const textFile = source.textPath?.startsWith("/source-texts/") ? `data-local/historical-sources/${basename(source.textPath)}` : (source.textPath ?? source.localFile);
  const fullText = source.fullText ?? await readFile(new URL(`../${textFile}`, import.meta.url), "utf8").catch(() => "");
  if (!fullText.trim()) continue;
  const words = fullText.replace(/\s+/g, " ").trim().split(" ");
  for (let start=0, n=0; start<words.length; start += chunkWords-overlap, n++) {
    const text = words.slice(start, start+chunkWords).join(" ");
    if (text.length < 200) continue;
    chunks.push({ id:`${source.sourceId}:chunk-${String(n+1).padStart(4,"0")}`, sourceId:source.sourceId, passageId:source.passageId, localFile:source.localFile, startWord:start, endWord:Math.min(start+chunkWords,words.length), text });
  }
}
const selectedChunks = chunks.length > maxChunks ? chunks.slice(0, maxChunks) : chunks;
const inputs = [...questions.map(q=>`Question ${q.n}: ${q.text}`), ...selectedChunks.map(c=>c.text)];
const estimate = Math.ceil(inputs.reduce((a,x)=>a+x.length,0)/3);
const usd = estimate/1e6*price;
if (usd > cap) throw new Error(`Preflight estimate $${usd.toFixed(4)} exceeds cap $${cap}`);
console.log(`Embedding ${inputs.length} inputs (${questions.length} questions, ${chunks.length} chunks), estimated $${usd.toFixed(4)}.`);
const vectors = []; let actualTokens = 0;
for (let start=0; start<inputs.length; start+=200) {
  const batch = inputs.slice(start,start+200);
  const res = await fetch("https://api.openai.com/v1/embeddings", { method:"POST", headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"}, body:JSON.stringify({model,input:batch,encoding_format:"float"}) });
  if (!res.ok) throw new Error(`OpenAI embeddings failed ${res.status}: ${await res.text()}`);
  const payload = await res.json(); actualTokens += payload.usage?.total_tokens ?? 0;
  vectors.push(...payload.data.sort((a,b)=>a.index-b.index).map(x=>x.embedding));
}
const cosine=(a,b)=>{let d=0,aa=0,bb=0; for(let i=0;i<a.length;i++){d+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];} return d/Math.sqrt(aa*bb);};
const qv=vectors.slice(0,questions.length), cv=vectors.slice(questions.length);
const results=questions.map((q,i)=>({question_id:q.n, question:q.text, candidates:selectedChunks.map((c,j)=>({...c, text:undefined, cosine_similarity:Number(cosine(qv[i],cv[j]).toFixed(6)), excerpt:c.text})).sort((a,b)=>b.cosine_similarity-a.cosine_similarity).slice(0,topK)}));
const out={run:{id:"historical-answer-key-retrieval-v1",at:new Date().toISOString(),model,source_count:sources.length,chunk_count:selectedChunks.length,question_count:questions.length,estimated_usd:Number(usd.toFixed(6)),actual_tokens:actualTokens,source_text_sha256:createHash("sha256").update(JSON.stringify(selectedChunks.map(c=>[c.sourceId,c.text]))).digest("hex")},results};
await writeFile(new URL("research/answer-key-retrieval-candidates.json",root), JSON.stringify(out,null,2)+"\n");
console.log("Wrote research/answer-key-retrieval-candidates.json");
