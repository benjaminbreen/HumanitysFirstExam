"""Tethering test: can model answers be matched to passages in a period corpus?

  python tether.py embed      # chunk texts/, embed with text-embedding-3-small
  python tether.py retrieve   # embed answers, pull top-k passages per answer

Answers tested: every no-passage answer from both models, plus every answer
coded off-key in any condition. For answers given after a passage, that
passage's own work is excluded from retrieval, so an echo cannot count.
"""
import json
import os
import random
import re
import sys
from pathlib import Path

import numpy as np
from openai import OpenAI

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
MODEL = "text-embedding-3-small"
K = 8
SET_WORK = {"plato-phaedrus": "1636", "zhuangzi": "59709", "rousseau-inegalite": "11136",
            "forster-machine-stops": "forster", "butler-erewhon": "1906", "wilde-soul": "1017",
            "irrelevant-white": "1408"}


def client():
    for line in (ROOT / ".env.local").read_text().splitlines():
        if line.startswith("OPENAI_API_KEY="):
            os.environ["OPENAI_API_KEY"] = line.split("=", 1)[1].strip().strip('"')
    return OpenAI()


def sources():
    out = {}
    for line in (HERE / "sources.tsv").read_text().splitlines():
        sid, author, title, year = line.split("\t")
        out[sid] = {"author": author, "title": title, "year": int(year)}
    return out


def clean(text):
    s = re.search(r"\*\*\* ?START OF.*?\*\*\*", text)
    e = re.search(r"\*\*\* ?END OF", text)
    text = text[s.end() if s else 0: e.start() if e else len(text)]
    text = re.sub(r"\{\{[^}]*\}\}|\[\[|\]\]|<[^>]+>", " ", text)  # wiki markup
    return text


def chunks(text, target=220):
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", text)]
    paras = [p for p in paras if len(p.split()) >= 8]
    out, cur = [], []
    for p in paras:
        words = p.split()
        while len(words) > target * 1.5:  # split very long paragraphs
            out.append(" ".join(cur + words[:target])) if cur else out.append(" ".join(words[:target]))
            cur, words = [], words[target:]
        cur += words
        if len(cur) >= target:
            out.append(" ".join(cur))
            cur = []
    if len(cur) > 40:
        out.append(" ".join(cur))
    return out


def embed_all(cl, texts, batch=256):
    vecs = []
    for i in range(0, len(texts), batch):
        r = cl.embeddings.create(model=MODEL, input=[t[:8000] for t in texts[i:i + batch]])
        vecs += [d.embedding for d in r.data]
        print(f"  {min(i + batch, len(texts))}/{len(texts)}", file=sys.stderr)
    v = np.array(vecs, dtype=np.float32)
    return v / np.linalg.norm(v, axis=1, keepdims=True)


def embed():
    cl, src = client(), sources()
    passages = []
    for sid in src:
        for n, c in enumerate(chunks(clean((HERE / "texts" / f"{sid}.txt").read_text(errors="ignore")))):
            passages.append({"pid": f"{sid}:{n}", "work": sid, "text": c})
    print(len(passages), "passages,", sum(len(p["text"].split()) for p in passages), "words")
    np.save(HERE / "passages.npy", embed_all(cl, [p["text"] for p in passages]))
    (HERE / "passages.json").write_text(json.dumps(passages, ensure_ascii=False))


def retrieve():
    cl, src = client(), sources()
    passages = json.loads((HERE / "passages.json").read_text())
    P = np.load(HERE / "passages.npy")
    data = json.loads((ROOT / "data" / "trials" / "dependence.json").read_text())
    answers = [r for r in data["responses"] if r["set"] == "none" or r["code"] == "off-key"]
    A = embed_all(cl, [r["text"] for r in answers])
    rng = random.Random(1931)
    items = []
    for r, a in zip(answers, A):
        sims = P @ a
        excl = SET_WORK.get(r["set"])
        order = [i for i in np.argsort(-sims) if passages[i]["work"] != excl][:K]
        cands = [{"cid": f"c{j + 1}", "pid": passages[i]["pid"], "sim": round(float(sims[i]), 3),
                  "source": f'{src[passages[i]["work"]]["author"]}, {src[passages[i]["work"]]["title"]} ({src[passages[i]["work"]]["year"]})',
                  "text": passages[i]["text"]} for j, i in enumerate(order)]
        items.append({"aid": "a" + "".join(rng.choice("0123456789abcdef") for _ in range(6)),
                      "response": r["id"], "model": r["model"], "set": r["set"], "code": r["code"],
                      "answer": r["text"], "candidates": cands})
    rng.shuffle(items)
    (HERE / "retrieved.json").write_text(json.dumps(items, ensure_ascii=False, indent=1))
    # Blind batches for verification: answer text + candidates only.
    B = 12
    for b in range(0, len(items), B):
        blind = [{"aid": it["aid"], "answer": it["answer"],
                  "candidates": [{"cid": c["cid"], "source": c["source"], "text": c["text"]} for c in it["candidates"]]}
                 for it in items[b:b + B]]
        (HERE / f"verify_batch_{b // B + 1:02d}.json").write_text(json.dumps(blind, ensure_ascii=False, indent=1))
    print(len(items), "answers;", (len(items) + B - 1) // B, "verification batches")


if __name__ == "__main__":
    {"embed": embed, "retrieve": retrieve}[sys.argv[1]]()
