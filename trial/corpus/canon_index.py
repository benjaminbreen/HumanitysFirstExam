"""The accepted canon as a search corpus: every downloaded text of the works
in data/works.json, split into ~220-word passages, 512-dimension embeddings.

  python canon_index.py extract    # -> broad/canon.json
  python canon_index.py embed      # -> broad/canon.npy (resumable parts)

Then `python build_index.py canon` writes it into index/. Replaces the
47-work canon stand-in (now the corpus "canon-standin").
"""
import json
import sys
from pathlib import Path

import numpy as np

from tether import chunks, clean, client

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = HERE / "broad"
DIMS = 512


def extract():
    rows = []
    for w in json.loads((ROOT / "data" / "works.json").read_text())["works"]:
        for t in w["texts"]:
            f = HERE / t["file"]
            if not f.exists():
                continue
            source = f"{w['authorShort']}, {w['title']}"
            if t["role"] != "main" or t["language"] != "English":
                source += f" ({t['language']}{', translation' if t['role'] == 'translation' else ''})"
            for c in chunks(clean(f.read_text(errors="ignore"))):
                rows.append({"source": source, "year": w["year"], "work": w["id"], "text": c})
    OUT.mkdir(exist_ok=True)
    (OUT / "canon.json").write_text(json.dumps(rows, ensure_ascii=False))
    print(len(rows), "passages,", sum(len(r["text"].split()) for r in rows), "words")


def embed():
    import tiktoken
    enc = tiktoken.get_encoding("cl100k_base")
    cl = client()
    rows = json.loads((OUT / "canon.json").read_text())
    parts = OUT / "canon_parts"
    parts.mkdir(exist_ok=True)
    step = 20000
    for i in range(0, len(rows), step):
        f = parts / f"{i // step:03d}.npy"
        if f.exists():
            continue
        vecs = []
        end = min(i + step, len(rows))
        # Batches stay under the API's 300,000 tokens per request.
        batch, tokens = [], 0
        for j in range(i, end + 1):
            n = len(enc.encode(rows[j]["text"])) if j < end else 0
            if batch and (j == end or len(batch) == 256 or tokens + n > 250_000):
                r = cl.embeddings.create(model="text-embedding-3-small", dimensions=DIMS, input=batch)
                vecs += [d.embedding for d in r.data]
                batch, tokens = [], 0
            if j < end:
                batch.append(enc.decode(enc.encode(rows[j]["text"])[:8000]))
                tokens += min(n, 8000)
        v = np.array(vecs, dtype=np.float32)
        np.save(f, v / np.linalg.norm(v, axis=1, keepdims=True))
        print("part", i // step, file=sys.stderr, flush=True)
    np.save(OUT / "canon.npy", np.concatenate([np.load(f) for f in sorted(parts.glob("*.npy"))]))
    print(len(rows), "embedded")


if __name__ == "__main__":
    {"extract": extract, "embed": embed}[sys.argv[1]]()
