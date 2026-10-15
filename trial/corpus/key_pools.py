"""Candidate passages for building the position keys of the pilot questions.

  python key_pools.py            # -> research/keys/candidates.json
  python key_pools.py --merge    # research/keys/pools/Q*.json -> research/keys/pools.json

For each pilot question, rank every ~220-word chunk of every canon text by
similarity to the question text alone (text-embedding-3-small), and keep the
best 45, at most two per work. Chunk embeddings are cached in canon/emb/ and
recomputed when a text has changed. Readers screen these candidates down to
the pool shown on /keys.
"""
import json
import re
import sys
from pathlib import Path


HERE = Path(__file__).parent
ROOT = HERE.parent.parent
EMB = HERE / "canon" / "emb"
PILOT = ["Q01", "Q08", "Q18", "Q23", "Q30", "Q39"]
KEEP, PER_WORK = 45, 2


def main():
    import numpy as np
    from tether import chunks, clean, client, embed_all

    cl = client()
    works = json.loads((ROOT / "data/works.json").read_text())["works"]
    qs = {q["id"]: q for q in json.loads((ROOT / "data/questions.json").read_text())["questions"]}
    rows, vecs = [], []
    for w in works:
        for t in w.get("texts", []):
            f = HERE / t["file"]
            if not f.exists():
                continue
            cs = chunks(clean(f.read_text(errors="ignore")))
            if not cs:
                continue
            ef = EMB / f"{t['id']}.npy"
            v = np.load(ef) if ef.exists() else None
            if v is None or len(v) != len(cs):
                print("embedding", t["id"], len(cs), file=sys.stderr)
                v = embed_all(cl, cs)
                np.save(ef, v)
            for n, c in enumerate(cs):
                rows.append({"work": w["id"], "text_id": t["id"], "chunk": n, "language": t.get("language") or w["language"], "text": c})
            vecs.append(v)
    V = np.vstack(vecs)
    Q = embed_all(cl, [qs[q]["question"] for q in PILOT])
    out = {}
    for q, qv in zip(PILOT, Q):
        sims = V @ qv
        per, keep = {}, []
        for i in np.argsort(-sims):
            r = rows[i]
            if per.get(r["work"], 0) >= PER_WORK:
                continue
            per[r["work"]] = per.get(r["work"], 0) + 1
            keep.append({**r, "sim": round(float(sims[i]), 3)})
            if len(keep) >= KEEP:
                break
        out[q] = {"question": qs[q]["question"], "candidates": keep}
        print(q, len(keep), "candidates from", len(per), "works")
    dest = ROOT / "research/keys"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "candidates.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))


def norm(s):
    s = re.sub(r"[‘’´`]", "'", re.sub(r"[“”]", '"', s)).replace("\xad", "")
    return re.sub(r"\s+", " ", s).strip().lower()


def merge():
    """Check each screened excerpt is verbatim in its file, number it, write pools.json."""
    qs = {q["id"]: q for q in json.loads((ROOT / "data/questions.json").read_text())["questions"]}
    out = []
    for q in PILOT:
        f = ROOT / "research/keys/pools" / f"{q}.json"
        if not f.exists():
            print(q, "no pool yet")
            continue
        kept = []
        for p in json.loads(f.read_text()):
            src = ROOT / p["file"] if not str(p["file"]).startswith("/") else Path(p["file"])
            hay = norm(src.read_text(errors="replace")) if src.exists() else ""
            segs = [norm(x) for x in re.split(r"\s*(?:…|\.\.\.|\[\.\.\.\])\s*", p["text"]) if x.strip()]
            if not segs or not all(x in hay for x in segs):
                print(q, "not verbatim, dropped:", p["author"], p["text"][:60])
                continue
            kept.append(p)
        kept.sort(key=lambda p: (p.get("year") or 0, p["author"]))
        out.append({
            "question": q, "text": qs[q]["question"],
            "passages": [{"id": f"p{i + 1:02d}", "work": p["work"], "author": p["author"], "title": p["title"],
                          "year": p.get("year"), "language": p.get("language") or "English",
                          "display": p.get("display") or p["text"], "text": p["text"],
                          "translation": p.get("translation") or None} for i, p in enumerate(kept)],
        })
        print(q, len(kept), "passages from", len({p["work"] for p in kept}), "works")
    (ROOT / "research/keys/pools.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    merge() if "--merge" in sys.argv else main()
