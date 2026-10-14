"""Pick the passages of a non-English work most relevant to its questions.

  python select_passages.py <work-id>... [--k 4]

For each work: split the original text into ~220-word passages, embed them
(text-embedding-3-small, which is multilingual), and rank them by similarity
to (a) each question the work was selected for and (b) the argument the
research agent attributed to it. Keeps the top k per question, deduplicated,
with neighbouring context. Output: research/translations/<work-id>.passages.json.
Nothing is translated here.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

from tether import chunks, client, embed_all

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUTDIR = ROOT / "research" / "translations"


CITE = ("Bd.", "Kap.", "Ebenda", "ebenda", "Vgl.", "vgl.", "S. ", "ff.", "op. cit", "ibid", "Ibid", "p. ", "pp. ", "т.", "с. ")


def drop_notes(text):
    """Remove footnote lines: a note number, then a citation (Bd., Kap., ibid, p., ...)."""
    keep = []
    for line in text.splitlines():
        if re.match(r"^\s*\d{1,3}\s", line) and len(line) < 600 and any(c in line for c in CITE):
            continue
        keep.append(line)
    return "\n".join(keep)


def prose(p):
    """Passages of running prose: enough words, few numbers once page markers like [78] are ignored."""
    ws = re.sub(r"\[\d+\]", "", p).split()
    return len(ws) >= 60 and sum(any(ch.isdigit() for ch in w) for w in ws) / len(ws) < 0.06


def main():
    argv = sys.argv[1:]
    k = 4
    if "--k" in argv:
        i = argv.index("--k")
        k = int(argv[i + 1])
        argv = argv[:i] + argv[i + 2:]
    args = argv
    OUTDIR.mkdir(parents=True, exist_ok=True)
    manifest = {w["id"]: w for w in json.loads((HERE / "canon" / "manifest.json").read_text())}
    cands = json.loads((ROOT / "research" / "canon-candidates" / "candidates.json").read_text())
    questions = {q["id"]: q["question"] for q in json.loads((ROOT / "research" / "canon-candidates" / "questions.json").read_text())}
    cl = client()
    for wid in args:
        w = manifest[wid]
        base = manifest.get(w.get("of"), w)
        text = (HERE / w["file"]).read_text()
        ps = [p for p in chunks(drop_notes(text)) if prose(p)]
        P = embed_all(cl, ps)
        picked = {}
        for q in w["questions"]:
            args_for_q = [c["argument"] for c in cands if c["q"] == q and c["author"] == base["author"]]
            queries = [questions[q]] + args_for_q
            Q = embed_all(cl, queries)
            score = (P @ Q.T).max(axis=1)
            for i in np.argsort(-score)[:k]:
                picked.setdefault(int(i), {"questions": [], "score": 0.0})
                picked[int(i)]["questions"].append(q)
                picked[int(i)]["score"] = max(picked[int(i)]["score"], float(score[i]))
        out = [{
            "pid": f"{wid}:{i}", "work": wid, "author": base["author"], "title": base["title"],
            "original_title": base.get("original_title", ""), "language": base.get("language", ""),
            "questions": v["questions"], "score": round(v["score"], 3),
            "before": ps[i - 1][-400:] if i > 0 else "", "original": ps[i],
            "after": ps[i + 1][:400] if i + 1 < len(ps) else "",
        } for i, v in sorted(picked.items())]
        (OUTDIR / f"{wid}.passages.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
        print(wid, base["author"], "->", len(out), "passages from", len(ps))


if __name__ == "__main__":
    main()
