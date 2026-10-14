"""Find candidate passages for each stance (one work's answer to one question).

  python stance_passages.py            # -> research/passages/candidates.json

For every stance whose work has a downloaded text:
  1. Anchor: if the research agent's `checked` note quotes the text, find that
     quote in the file and take the passage around it.
  2. Embedding: split the text into ~220-word chunks and rank them by
     similarity to the argument, the side, and the question
     (text-embedding-3-small, multilingual).
Keeps up to three candidates per stance, each with its neighbours as context.
English texts are preferred when a work has both an English text and an
original. Nothing is chosen here; a reviewer picks the passage (REVIEW.md).
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

from tether import chunks, clean, client, embed_all

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = ROOT / "research" / "passages"
EMB = HERE / "canon" / "emb"
K = 3
EN = {"the", "and", "of", "to", "is", "that", "which", "it", "in", "not", "be", "with"}


def is_english(text):
    words = re.findall(r"[a-z]+", text[:200000].lower())
    return bool(words) and sum(w in EN for w in words) / len(words) > 0.12


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[‘’´`]", "'", re.sub(r"[“”]", '"', s))).strip().lower()


def loose(s):
    return " ".join(re.findall(r"[a-z0-9à-ÿ]+", s.lower()))


def quotes(checked):
    return [q for q in re.findall(r"['‘\"“](.{25,}?)['’\"”](?=[\s.,;:)]|$)", checked) if len(q.split()) >= 5]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    EMB.mkdir(exist_ok=True)
    works = {w["id"]: w for w in json.loads((ROOT / "data" / "works.json").read_text())["works"]}
    stances = json.loads((ROOT / "data" / "stances.json").read_text())["stances"]
    questions = {q["id"]: q["question"] for q in json.loads((ROOT / "data" / "questions.json").read_text())["questions"]}
    only = set(sys.argv[1:])
    cl = client()
    out, cache = [], {}
    for s in stances:
        if only and s["work"] not in only:
            continue
        w = works[s["work"]]
        files = []
        for t in w["texts"]:
            raw = clean((HERE / t["file"]).read_text(errors="ignore"))
            files.append((t, raw, is_english(raw)))
        if not files:
            continue
        english = [f for f in files if f[2]]
        use = english or files
        cands = []
        for t, raw, en in use:
            key = t["id"]
            if key not in cache:
                cs = chunks(raw)
                if not cs:
                    continue
                print(w["id"], t["id"], len(cs), "chunks", file=sys.stderr)
                npy = EMB / f"{key}.npy"
                if npy.exists() and len(np.load(npy)) == len(cs):
                    cache[key] = (cs, np.load(npy))
                else:
                    # Small batches: OCR noise and non-Latin scripts tokenize heavily.
                    cache[key] = (cs, embed_all(cl, [c[:4000] for c in cs], batch=48))
                    np.save(npy, cache[key][1])
            cs, P = cache[key]
            ctx = lambda i: {"before": cs[i - 1] if i > 0 else "", "text": cs[i], "after": cs[i + 1] if i + 1 < len(cs) else ""}
            # 1. anchors from quoted strings in the checking note
            normed = [loose(c) for c in cs]
            for q in quotes(s["checked"]):
                ws = loose(q).split()
                probes = [" ".join(ws[k:k + 8]) for k in range(0, max(1, len(ws) - 7), 4)]
                hit = next((i for i, c in enumerate(normed)
                            if any(p in c or (i + 1 < len(cs) and p in c + " " + normed[i + 1]) for p in probes)), None)
                if hit is not None:
                    cands.append({"method": "quoted in check note", "file": t["id"], "chunk": hit, "score": 1.0, **ctx(hit)})
            # 2. embedding ranking
            queries = [s["argument"], f"{questions[s['question']]} {s['sideLabel']}: {s['sideGloss']}"]
            Q = embed_all(cl, queries)
            score = (P @ Q.T).max(axis=1)
            for i in np.argsort(-score)[: K + 2]:
                cands.append({"method": "embedding", "file": t["id"], "chunk": int(i), "score": round(float(score[i]), 3), **ctx(int(i))})
        seen, keep = set(), []
        for c in cands:
            k = (c["file"], c["chunk"])
            if k in seen or any(k[0] == f and abs(k[1] - n) <= 1 for f, n in seen):
                continue
            seen.add(k)
            keep.append(c)
        keep = keep[:K]
        for n, c in enumerate(keep):
            c["cid"] = f"c{n + 1}"
        out.append({
            "stance": s["id"], "work": w["id"], "author": w["author"], "title": w["title"], "year": w["year"],
            "language": w["language"], "textEnglish": bool(english),
            "question": s["question"], "questionText": questions[s["question"]],
            "side": s["sideLabel"], "sideGloss": s["sideGloss"], "argument": s["argument"], "where": s["where"],
            "candidates": keep,
        })
    (OUT / "candidates.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(len(out), "stances with candidates;", sum(1 for o in out if o["candidates"] and o["candidates"][0]["method"] != "embedding"), "anchored")


if __name__ == "__main__":
    main()
