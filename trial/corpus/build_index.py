"""Build the local search index used by the site's /search page.

  python build_index.py              # all corpora whose vectors exist
  python build_index.py sermons      # rebuild only the named corpora
  python build_index.py --deploy     # write ../../search-index/ (canon only)

For each corpus writes, under index/:
  <name>.i8       int8 vectors (round(v * 127)), row-major, 1536 or 512 dims
  <name>.jsonl    one JSON object per passage: source, year, text
  <name>.off      uint64 byte offset of each line in the .jsonl
and index/manifest.json listing the corpora and their sizes.

index/ is local only (1.8 GB). --deploy copies the canon corpus into
search-index/ at the repository root, with the passages gzipped, for the
deployed site; the search code reads index/ when present, else that.
"""
import gzip
import shutil
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE / "index"


def canon():
    src = {}
    for line in (HERE / "sources.tsv").read_text().splitlines():
        sid, author, title, year = line.split("\t")
        src[sid] = (f"{author}, {title}", int(year))
    for p in json.loads((HERE / "passages.json").read_text()):
        s, y = src[p["work"]]
        yield {"source": s, "year": y, "text": p["text"]}


def canon_accepted():
    for r in json.loads((HERE / "broad" / "canon.json").read_text()):
        yield {k: r.get(k) for k in ("source", "year", "work", "text")}


def magazines():
    for p in json.loads((HERE / "per_passages.json").read_text()):
        m = re.search(r"\b(1[6-9]\d\d)\b", p["source"])
        yield {"source": p["source"], "year": int(m.group(1)) if m else None, "text": p["text"]}


def newspapers():
    for p in json.loads((HERE / "news_passages.json").read_text()):
        yield {"source": p["source"], "year": p["year"], "state": p.get("state"), "text": p["text"]}


def broad(name):
    def rows():
        for r in json.loads((HERE / "broad" / f"{name}.json").read_text()):
            yield {k: r.get(k) for k in ("source", "year", "state", "text")}
    return rows


# id, label, rows, vectors, dims
CORPORA = [
    ("canon", "Canon (accepted works, downloaded texts)", canon_accepted, "broad/canon.npy", 512),
    ("canon-standin", "Canon stand-in (47 works, chosen by Claude; superseded)", canon, "passages.npy", 1536),
    ("magazines", "Magazines, machine-related passages", magazines, "per_passages.npy", 1536),
    ("newspapers", "Newspapers 1880–1930, machine-related (5% of pages)", newspapers, "news_passages.npy", 1536),
    ("magazines-all", "Magazines, all passages (28 titles, 491 issues)", broad("magazines-all"), "broad/magazines-all.npy", 512),
    ("newspapers-all", "Newspapers 1880–1930, all articles (2% of pages)", broad("newspapers-all"), "broad/newspapers-all.npy", 512),
    ("sermons", "Sermons (150 English texts; years estimated)", broad("sermons"), "broad/sermons.npy", 512),
]


def main():
    OUT.mkdir(exist_ok=True)
    manifest = []
    only = sys.argv[1:]  # optional: rebuild only these corpora
    old = json.loads((OUT / "manifest.json").read_text())["corpora"] if (OUT / "manifest.json").exists() else []
    for name, label, rows, npy, dims in CORPORA:
        if only and name not in only:
            manifest += [m for m in old if m["id"] == name]
            continue
        if not (HERE / npy).exists():
            print("skip (not built):", name)
            continue
        V = np.load(HERE / npy, mmap_mode="r")
        with open(OUT / f"{name}.i8", "wb") as fv:
            for i in range(0, len(V), 20000):
                fv.write(np.clip(np.round(V[i:i + 20000] * 127), -127, 127).astype(np.int8).tobytes())
        offsets, pos = [], 0
        years = []
        with open(OUT / f"{name}.jsonl", "wb") as fm:
            for r in rows():
                line = (json.dumps(r, ensure_ascii=False) + "\n").encode()
                offsets.append(pos)
                pos += len(line)
                fm.write(line)
                years.append(r["year"] or 0)
        assert len(offsets) == len(V), (name, len(offsets), len(V))
        np.array(offsets, dtype=np.uint64).tofile(OUT / f"{name}.off")
        np.array(years, dtype=np.int16).tofile(OUT / f"{name}.yr")
        manifest.append({"id": name, "label": label, "count": len(offsets), "dims": dims})
        print(name, len(offsets))
    # Labels and defaults always come from CORPORA. The machine-filtered
    # magazine and newspaper sets overlap the broad ones, so they are off by default.
    meta = {c[0]: c for c in CORPORA}
    for m in manifest:
        m["label"] = meta[m["id"]][1]
        m["dims"] = meta[m["id"]][4]
        m["default"] = m["id"] not in ("magazines", "newspapers", "canon-standin")
    manifest.sort(key=lambda m: [c[0] for c in CORPORA].index(m["id"]))
    (OUT / "manifest.json").write_text(json.dumps({"model": "text-embedding-3-small", "corpora": manifest}, indent=1))


def deploy():
    dest = HERE.parent.parent / "search-index"
    dest.mkdir(exist_ok=True)
    manifest = json.loads((OUT / "manifest.json").read_text())
    keep = [m for m in manifest["corpora"] if m["id"] == "canon"]
    for m in keep:
        for ext in ("i8", "yr"):
            shutil.copyfile(OUT / f"{m['id']}.{ext}", dest / f"{m['id']}.{ext}")
        with open(OUT / f"{m['id']}.jsonl", "rb") as src, gzip.open(dest / f"{m['id']}.jsonl.gz", "wb", 9) as out:
            shutil.copyfileobj(src, out)
    (dest / "manifest.json").write_text(json.dumps({**manifest, "corpora": keep}, indent=1))
    print("deployed:", [m["id"] for m in keep])


if __name__ == "__main__":
    deploy() if sys.argv[1:] == ["--deploy"] else main()
