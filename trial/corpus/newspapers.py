"""Extract a rule-based newspaper sample from American Stories (Harvard).

  python newspapers.py extract     # amstories/faro_*.tar.gz -> news_passages.json
  python newspapers.py embed       # news_passages.json -> news_passages.npy (resumable)

Rule: keep a page if sha1(filename) falls in the lowest 5% (uniform,
reproducible, one pass). From kept pages take every block classed "article",
then keep articles that pass the same machine-term filter as the magazines.
The filter says nothing about stance. Long articles are chunked like the
other corpora.
"""
import hashlib
import json
import re
import sys
import tarfile
from collections import Counter
from pathlib import Path

from periodicals import TERMS
from tether import chunks

HERE = Path(__file__).parent
SHARE = 0.05


def keep(name):
    return int(hashlib.sha1(name.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF < SHARE


def extract():
    out, stats = [], Counter()
    for tgz in sorted((HERE / "amstories").glob("faro_*.tar.gz")):
        year = tgz.stem.split("_")[1].split(".")[0]
        with tarfile.open(tgz, "r:gz") as tar:
            for m in tar:
                if not m.isfile() or not m.name.endswith(".json"):
                    continue
                stats[f"{year} pages"] += 1
                if not keep(m.name):
                    continue
                stats[f"{year} sampled"] += 1
                try:
                    page = json.load(tar.extractfile(m))
                except Exception:
                    continue
                paper = page.get("lccn", {}).get("title", "")
                state = page.get("lccn", {}).get("state", "")
                date = page.get("edition", {}).get("date", year)
                for b in page.get("bboxes", []):
                    if b.get("class") != "article":
                        continue
                    text = re.sub(r"-\n(\w)", r"\1", b.get("raw_text", ""))
                    if len(text.split()) < 60 or not TERMS.search(text):
                        continue
                    for n, c in enumerate(chunks(text)):
                        out.append({"pid": f"{m.name.split('/')[-1][:-5]}:{b.get('id')}:{n}",
                                    "source": f"{paper.split('[')[0].strip().rstrip('.')}, {date}",
                                    "state": state, "year": int(year), "text": c})
                        stats[f"{year} passages"] += 1
        print(year, {k: v for k, v in stats.items() if k.startswith(year)}, file=sys.stderr, flush=True)
    (HERE / "news_passages.json").write_text(json.dumps(out, ensure_ascii=False))
    print(len(out), "passages,", sum(len(p["text"].split()) for p in out), "words")


def embed():
    """Embed news_passages.json in resumable parts of 20k passages."""
    import numpy as np
    from tether import client, embed_all
    cl = client()
    ps = json.loads((HERE / "news_passages.json").read_text())
    parts = HERE / "news_parts"
    parts.mkdir(exist_ok=True)
    step = 20000
    for i in range(0, len(ps), step):
        f = parts / f"{i // step:03d}.npy"
        if f.exists():
            continue
        np.save(f, embed_all(cl, [p["text"] for p in ps[i:i + step]]))
        print("part", i // step, "done", file=sys.stderr, flush=True)
    np.save(HERE / "news_passages.npy", np.concatenate([np.load(f) for f in sorted(parts.glob("*.npy"))]))
    print(len(ps), "embedded")


if __name__ == "__main__":
    {"extract": extract, "embed": embed}[sys.argv[1]]()
