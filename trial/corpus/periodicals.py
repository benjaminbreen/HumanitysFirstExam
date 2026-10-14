"""Periodicals test: rerun matching for answers not yet matched in the canon corpus.

  python periodicals.py embed      # chunk periodicals/, keyword-filter, embed
  python periodicals.py retrieve   # retrieve for unmatched answers, write blind batches

Selection: up to 20 random issues (seed 1930) of each of 28 English-language
magazines on Project Gutenberg (periodicals_sel.json). Topic filter keeps
passages with at least one machine-related term; it says nothing about stance.
"""
import json
import random
import re
import sys
from pathlib import Path

import numpy as np

from tether import K, SET_WORK, chunks, clean, client, embed_all

HERE = Path(__file__).parent
TERMS = re.compile(
    r"\b(machin\w*|mechani\w*|engine\w*|automat\w*|tools?|invent\w*|labou?r-saving|factor(y|ies)|"
    r"steam|electric\w*|contrivance\w*|apparatus|typewriter\w*|telegraph\w*|telephone\w*|mill\w*|"
    r"manufactur\w*|industr\w*|technic\w*|appliance\w*|motor\w*|dynamo\w*)\b",
    re.I,
)


def embed():
    cl = client()
    sel = json.loads((HERE / "periodicals_sel.json").read_text())
    passages, total = [], 0
    for sid, mag, title in sel:
        f = HERE / "periodicals" / f"{sid}.txt"
        if not f.exists() or f.stat().st_size < 3000:
            continue
        for n, c in enumerate(chunks(clean(f.read_text(errors="ignore")))):
            total += 1
            if TERMS.search(c):
                passages.append({"pid": f"{sid}:{n}", "work": sid, "source": title, "text": c})
    print(f"{len(passages)} of {total} passages kept by topic filter; "
          f"{sum(len(p['text'].split()) for p in passages)} words")
    np.save(HERE / "per_passages.npy", embed_all(cl, [p["text"] for p in passages]))
    (HERE / "per_passages.json").write_text(json.dumps(passages, ensure_ascii=False))


def retrieve():
    cl = client()
    passages = json.loads((HERE / "per_passages.json").read_text())
    P = np.load(HERE / "per_passages.npy")
    prior = json.loads((HERE / "tethered.json").read_text())
    todo = [r for r in prior if r["status"] != "attested"]
    data = json.loads((HERE.parent.parent / "data" / "trials" / "dependence.json").read_text())
    text = {r["id"]: r["text"] for r in data["responses"]}
    A = embed_all(cl, [text[r["response"]] for r in todo])
    rng = random.Random(1932)
    items = []
    for r, a in zip(todo, A):
        sims = P @ a
        order = np.argsort(-sims)[:K]
        items.append({
            "aid": "p" + "".join(rng.choice("0123456789abcdef") for _ in range(6)),
            "response": r["response"], "model": r["model"], "set": r["set"], "code": r["code"],
            "prior_status": r["status"], "answer": text[r["response"]],
            "candidates": [{"cid": f"c{j + 1}", "pid": passages[i]["pid"], "sim": round(float(sims[i]), 3),
                            "source": passages[i]["source"], "text": passages[i]["text"]}
                           for j, i in enumerate(order)],
        })
    rng.shuffle(items)
    (HERE / "per_retrieved.json").write_text(json.dumps(items, ensure_ascii=False, indent=1))
    B = 12
    for b in range(0, len(items), B):
        blind = [{"aid": it["aid"], "answer": it["answer"],
                  "candidates": [{"cid": c["cid"], "source": c["source"], "text": c["text"]} for c in it["candidates"]]}
                 for it in items[b:b + B]]
        (HERE / f"per_verify_batch_{b // B + 1:02d}.json").write_text(json.dumps(blind, ensure_ascii=False, indent=1))
    print(len(items), "answers;", (len(items) + B - 1) // B, "batches")


if __name__ == "__main__":
    {"embed": embed, "retrieve": retrieve}[sys.argv[1]]()
