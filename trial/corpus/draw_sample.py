"""Draw the blind-coding sample and its passages.

  python draw_sample.py [--n 60] [--seed 1931]   # -> research/coding/sample.json

Sampling: stances whose work has a downloaded text, drawn round-robin across
the 40 questions (each question once before any twice), in an order fixed by
the seed. Items get opaque ids (i01, i02, ...) in a shuffled order.

Passages: for each item, the two chunks of the work's text most similar to
the QUESTION alone (text-embedding-3-small; English text preferred, as in
stance_passages.py), each with its neighbours. Opus's argument, side and
chosen quotation are never used, so the coder is not led to them.
"""
import argparse
import json
import random
from collections import defaultdict
from pathlib import Path

import numpy as np

from stance_passages import EMB, is_english
from tether import chunks, clean, client, embed_all

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = ROOT / "research" / "coding" / "sample.json"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=60)
    ap.add_argument("--seed", type=int, default=1931)
    a = ap.parse_args()
    rng = random.Random(a.seed)

    works = {w["id"]: w for w in json.loads((ROOT / "data" / "works.json").read_text())["works"]}
    stances = json.loads((ROOT / "data" / "stances.json").read_text())["stances"]
    questions = {q["id"]: q for q in json.loads((ROOT / "data" / "questions.json").read_text())["questions"]}

    pool = defaultdict(list)
    for s in sorted(stances, key=lambda s: s["id"]):
        if works[s["work"]]["texts"]:
            pool[s["question"]].append(s)
    for q in pool:
        rng.shuffle(pool[q])
    qorder = sorted(pool)
    rng.shuffle(qorder)
    picked = []
    while len(picked) < a.n and any(pool.values()):
        for q in qorder:
            if pool[q] and len(picked) < a.n:
                picked.append(pool[q].pop())
    rng.shuffle(picked)

    cl = client()
    items = []
    for n, s in enumerate(picked, 1):
        w = works[s["work"]]
        files = []
        for t in w["texts"]:
            raw = clean((HERE / t["file"]).read_text(errors="ignore"))
            files.append((t, raw, is_english(raw)))
        use = [f for f in files if f[2]] or files
        Q = embed_all(cl, [questions[s["question"]]["question"]])[0]
        ranked = []
        for t, raw, _ in use:
            cs = chunks(raw)
            npy = EMB / f"{t['id']}.npy"
            P = np.load(npy) if npy.exists() else embed_all(cl, [c[:4000] for c in cs], batch=48)
            if len(P) != len(cs):
                P = embed_all(cl, [c[:4000] for c in cs], batch=48)
            for i in np.argsort(-(P @ Q))[:6]:
                ranked.append((float(P[i] @ Q), t["id"], int(i), cs))
        ranked.sort(key=lambda r: -r[0])
        passages, used = [], []
        for score, fid, i, cs in ranked:
            if any(fid == f and abs(i - j) <= 1 for f, j in used):
                continue
            used.append((fid, i))
            passages.append({
                "file": fid, "chunk": i,
                "before": cs[i - 1] if i > 0 else "", "text": cs[i], "after": cs[i + 1] if i + 1 < len(cs) else "",
            })
            if len(passages) == 2:
                break
        items.append({
            "item": f"i{n:02d}", "stance": s["id"], "question": s["question"], "work": w["id"],
            "textLanguage": "English" if use[0][2] else w["language"], "passages": passages,
        })
        print(f"i{n:02d}", s["id"])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "drawn": __import__("datetime").date.today().isoformat(), "seed": a.seed, "n": a.n,
        "method": "trial/corpus/draw_sample.py: round-robin over questions; passages retrieved by the question text only",
        "items": items,
    }, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
