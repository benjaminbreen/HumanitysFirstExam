"""Broad popular corpora: no topic filter, 512-dimension embeddings.

  python broad.py extract    # -> broad/<name>.json
  python broad.py embed      # -> broad/<name>.npy (resumable parts)

The machine-term filter used for the first magazine and newspaper indexes
misses arguments about habit, will, judgment and the state that never mention
machines. These corpora keep every passage.

- magazines-all: every passage of the 491 sampled magazine issues.
- newspapers-all: pages whose sha1(filename) falls in the lowest 2% (a subset
  of the 5% machine-filtered sample), every article of 60+ words, OCR floor.
- sermons: 150 English sermon texts on Gutenberg (subject "Sermons"), random
  sample, seed 1930 (sermons_sel.json).
"""
import hashlib
import json
import re
import sys
import tarfile
from pathlib import Path

import numpy as np

from tether import chunks, clean, client

HERE = Path(__file__).parent
OUT = HERE / "broad"
DIMS = 512
SHARE = 0.02


def vocab():
    v = {}
    for f in ("passages.json", "per_passages.json"):
        for p in json.loads((HERE / f).read_text()):
            for w in re.findall(r"[a-z]+", p["text"].lower()):
                v[w] = v.get(w, 0) + 1
    return {w for w, c in v.items() if c >= 3}


def ocr_ok(text, V, floor=0.8):
    ws = re.findall(r"[A-Za-z]+", text)
    return ws and sum(w.lower() in V for w in ws) / len(ws) >= floor


def magazines_all():
    out = []
    for sid, mag, title in json.loads((HERE / "periodicals_sel.json").read_text()):
        f = HERE / "periodicals" / f"{sid}.txt"
        if not f.exists() or f.stat().st_size < 3000:
            continue
        m = re.search(r"\b(1[6-9]\d\d)\b", title)
        for c in chunks(clean(f.read_text(errors="ignore"))):
            out.append({"source": title, "year": int(m.group(1)) if m else None, "text": c})
    return out


def sermons():
    out = []
    for sid, author, title in json.loads((HERE / "sermons_sel.json").read_text()):
        f = HERE / "sermons" / f"{sid}.txt"
        if not f.exists() or f.stat().st_size < 3000:
            continue
        years = [int(y) for y in re.findall(r"\b(1[5-9]\d\d)\b", author)]
        year = (years[0] + 30) if years else None  # rough: birth year + 30
        name = author.split(",")[0] + (", " + author.split(",")[1].strip() if "," in author else "")
        for c in chunks(clean(f.read_text(errors="ignore"))):
            out.append({"source": f"{name}, {title}", "year": year, "year_is_estimate": True, "text": c})
    return out


def newspapers_all(V):
    out = []
    keep = lambda n: int(hashlib.sha1(n.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF < SHARE
    for tgz in sorted((HERE / "amstories").glob("faro_*.tar.gz")):
        year = int(tgz.stem.split("_")[1].split(".")[0])
        with tarfile.open(tgz, "r:gz") as tar:
            for m in tar:
                if not (m.isfile() and m.name.endswith(".json") and keep(m.name)):
                    continue
                try:
                    page = json.load(tar.extractfile(m))
                except Exception:
                    continue
                paper = page.get("lccn", {}).get("title", "").split("[")[0].strip().rstrip(".")
                date = page.get("edition", {}).get("date", str(year))
                for b in page.get("bboxes", []):
                    if b.get("class") != "article":
                        continue
                    text = re.sub(r"-\n(\w)", r"\1", b.get("raw_text", ""))
                    if len(text.split()) < 60 or not ocr_ok(text, V):
                        continue
                    for c in chunks(text):
                        out.append({"source": f"{paper}, {date}", "year": year,
                                    "state": page.get("lccn", {}).get("state"), "text": c})
        print(year, len(out), file=sys.stderr, flush=True)
    return out


def extract():
    OUT.mkdir(exist_ok=True)
    V = vocab()
    for name, fn in [("magazines-all", magazines_all), ("sermons", sermons), ("newspapers-all", lambda: newspapers_all(V))]:
        rows = fn()
        (OUT / f"{name}.json").write_text(json.dumps(rows, ensure_ascii=False))
        print(name, len(rows), "passages,", sum(len(r["text"].split()) for r in rows), "words")


def embed():
    cl = client()
    for name in ("magazines-all", "sermons", "newspapers-all"):
        rows = json.loads((OUT / f"{name}.json").read_text())
        parts = OUT / f"{name}_parts"
        parts.mkdir(exist_ok=True)
        step = 20000
        for i in range(0, len(rows), step):
            f = parts / f"{i // step:03d}.npy"
            if f.exists():
                continue
            vecs = []
            end = min(i + step, len(rows))
            for j in range(i, end, 256):
                r = cl.embeddings.create(model="text-embedding-3-small", dimensions=DIMS,
                                         input=[x["text"][:8000] for x in rows[j:min(j + 256, end)]])
                vecs += [d.embedding for d in r.data]
            v = np.array(vecs, dtype=np.float32)
            np.save(f, v / np.linalg.norm(v, axis=1, keepdims=True))
            print(name, "part", i // step, file=sys.stderr, flush=True)
        np.save(OUT / f"{name}.npy", np.concatenate([np.load(f) for f in sorted(parts.glob("*.npy"))]))
        print(name, len(rows), "embedded")


if __name__ == "__main__":
    {"extract": extract, "embed": embed}[sys.argv[1]]()
