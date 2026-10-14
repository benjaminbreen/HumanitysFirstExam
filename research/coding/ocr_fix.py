"""Mechanical OCR fixes for the passage-check quotations (PROTOCOL.md, amendment of 14 Oct 2026).

Two fixes only, applied to the 60 sampled stances' quotations:
  1. Line-break hyphens: "con- tagious" -> "contagious". In English, a join is
     kept as a hyphenated word ("surplus-value") when both halves are words and
     the joined form is not. A break before a capital or a one-letter word, or
     between two short words ("to- the"), is left alone: these usually span a
     page, column or margin note.
  2. Long s read as f, in English text only: "fuppofe" -> "suppose", when the
     word is not in the dictionary and some choice of f -> s makes it one.

The verbatim OCR text stays in data/passages.json as "original". Output goes to
research/passages/ocr-corrections.json, which scripts/build_data.py reads.
Entries whose method starts with "hand" are never overwritten by this script.

Usage: python3 research/coding/ocr_fix.py
"""

import itertools
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "research" / "passages" / "ocr-corrections.json"
WORDS = {w.strip().lower() for w in open("/usr/share/dict/words")}


SUFFIXES = ("s", "es", "ed", "d", "ing", "ly", "er", "est")


def is_word(w):
    w = w.lower()
    if w in WORDS:
        return True
    return any(w.endswith(x) and len(w) - len(x) >= 3 and w[: -len(x)] in WORDS for x in SUFFIXES)


def looks_english(text):
    toks = re.findall(r"[a-z]{3,}", text)
    return bool(toks) and sum(is_word(t) for t in toks) / len(toks) > 0.7


def fix_hyphens(text, english, changes):
    def join(m):
        a, b = m.group(1), m.group(2)
        if not english or is_word(a + b) or not (is_word(a) and is_word(b)):
            if len(b) < 2:
                return m.group(0)
            new = a + b
        elif min(len(a), len(b)) >= 3:
            new = f"{a}-{b}"
        else:
            return m.group(0)
        changes.append([m.group(0), new])
        return new

    return re.sub(r"(\w+)- +([a-zà-ÿ]\w*)", join, text)


def fix_long_s(text, changes):
    def fix(m):
        w = m.group(0)
        if is_word(w):
            return w
        idx = [i for i, c in enumerate(w) if c == "f"]
        for k in range(1, len(idx) + 1):
            for subset in itertools.combinations(idx, k):
                cand = "".join("s" if i in subset else c for i, c in enumerate(w))
                if is_word(cand):
                    changes.append([w, cand])
                    return cand
        return w

    return re.sub(r"\b[A-Za-z]*f[A-Za-z]*\b", fix, text)


def main():
    sample = json.loads((ROOT / "research/coding/sample.json").read_text())
    stances = {s["id"]: s for s in json.loads((ROOT / "data/stances.json").read_text())["stances"]}
    passages = {p["id"]: p for p in json.loads((ROOT / "data/passages.json").read_text())["passages"]}
    old = {c["stance"]: c for c in json.loads(OUT.read_text())} if OUT.exists() else {}

    out = []
    for it in sample["items"]:
        sid = it["stance"]
        if old.get(sid, {}).get("method", "").startswith("hand"):
            out.append(old[sid])
            continue
        p = passages.get(stances[sid].get("passage"))
        if not p:
            continue
        english = p["language"] == "English" or looks_english(p["original"])
        changes = []
        text = fix_hyphens(p["original"], english, changes)
        if english:
            text = fix_long_s(text, changes)
        if changes:
            out.append({"stance": sid, "item": it["item"], "method": "mechanical (research/coding/ocr_fix.py)",
                        "date": "2026-10-14", "corrected": text, "changes": changes})

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    for c in out:
        print(c["item"], c["method"].split()[0], c.get("changes", ""))
    print(len(out), "of", len(sample["items"]), "quotations changed")


if __name__ == "__main__":
    main()
