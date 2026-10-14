"""Split candidates.json into review batches of roughly equal length.

  python split.py [n]    # -> batches/batch01.json ...
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    items = json.loads((HERE / "candidates.json").read_text())
    size = lambda it: sum(len((c["before"] + c["text"] + c["after"]).split()) for c in it["candidates"])
    total = sum(size(i) for i in items)
    (HERE / "batches").mkdir(exist_ok=True)
    batches, cur, acc = [], [], 0
    for it in items:  # keep input order so a work's stances stay together
        cur.append(it)
        acc += size(it)
        if acc >= total / n and len(batches) < n - 1:
            batches.append(cur)
            cur, acc = [], 0
    batches.append(cur)
    for k, b in enumerate(batches, 1):
        (HERE / "batches" / f"batch{k:02d}.json").write_text(json.dumps(b, ensure_ascii=False, indent=1))
        print(f"batch{k:02d}", len(b), "items", sum(size(i) for i in b), "words")


if __name__ == "__main__":
    main()
