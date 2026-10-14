"""Prepare blind judging batches, and tally the judges' codes afterwards.

  python blind.py prep <run.jsonl> # one run -> judge/batch_*.json, key in judge/key.json
  python blind.py tally           # judge/codes_A_*.json, codes_B_*.json -> results.json

Batches hold only an opaque id and the answer text, shuffled across models
and conditions. The key mapping ids back to draws stays out of the batches.
"""
import json
import random
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
RUNS, JUDGE = HERE / "runs", HERE / "judge"
BATCH = 40

# Claim -> the prompt set holding its own passage, and its opposing set.
CLAIMS = {
    "C1": ("plato-phaedrus", "wilde-soul"),
    "C2": ("zhuangzi", "wilde-soul"),
    "C3": ("rousseau-inegalite", "wilde-soul"),
    "C4": ("forster-machine-stops", "wilde-soul"),
    "C5": ("butler-erewhon", "wilde-soul"),
    "C6": (None, None),  # Kapp: no passage yet, scored unprompted only
    "C7": ("wilde-soul", "forster-machine-stops"),
}


def prep(run_file):
    """Blind one run file. IDs are random, so batches from later runs
    can be added without renumbering or revealing the model."""
    draws = [json.loads(l) for l in (RUNS / run_file).read_text().splitlines() if l.strip()]
    rng = random.Random(run_file)
    rng.shuffle(draws)
    JUDGE.mkdir(exist_ok=True)
    kp = JUDGE / "key.json"
    key = json.loads(kp.read_text()) if kp.exists() else {}
    items = []
    for d in draws:
        oid = "d" + "".join(rng.choice("0123456789abcdef") for _ in range(6))
        key[oid] = {k: d[k] for k in ("id", "model", "set", "order")}
        items.append({"id": oid, "text": d["text"]})
    first = len(list(JUDGE.glob("batch_*.json"))) + 1
    for n, b in enumerate(range(0, len(items), BATCH)):
        (JUDGE / f"batch_{first + n:02d}.json").write_text(json.dumps(items[b:b + BATCH], ensure_ascii=False, indent=1))
    kp.write_text(json.dumps(key, indent=1))
    print(len(items), "draws in batches", first, "to", first + n)


def load_codes(judge):
    out = {}
    for f in sorted(JUDGE.glob(f"codes_{judge}_*.json")):
        for c in json.loads(f.read_text()):
            out[c["id"]] = c
    return out


def tally():
    key = json.loads((JUDGE / "key.json").read_text())
    a, b = load_codes("A"), load_codes("B")
    adj = {}
    if (JUDGE / "adjudicated.json").exists():
        adj = {c["id"]: c for c in json.loads((JUDGE / "adjudicated.json").read_text())}
    both = [i for i in key if i in a and i in b]
    agree_code = sum(a[i]["code"] == b[i]["code"] for i in both)
    agree_val = sum(a[i]["valence"] == b[i]["valence"] for i in both)
    disagree = [i for i in both if a[i]["code"] != b[i]["code"] and i not in adj]
    final = {}
    for i in both:
        final[i] = adj.get(i) or (a[i] if a[i]["code"] == b[i]["code"] else None)

    models = sorted({v["model"] for v in key.values()})
    res = {"coded": len(both), "agree_code": agree_code, "agree_valence": agree_val,
           "unresolved": disagree, "models": {}}
    for m in models:
        by_set = {}
        for i, v in key.items():
            if v["model"] != m or final.get(i) is None:
                continue
            by_set.setdefault(v["set"], []).append(final[i])
        count = lambda s, code: sum(c["code"] == code for c in by_set.get(s, []))
        claims = {}
        for cid, (own, opp) in CLAIMS.items():
            claims[cid] = {
                "none": count("none", cid),
                "matching": count(own, cid) if own else None,
                "opposing": count(opp, cid) if opp else None,
                "irrelevant": count("irrelevant-white", cid),
            }
        none = by_set.get("none", [])
        res["models"][m] = {
            "claims": claims,
            "none_codes": dict(Counter(c["code"] for c in none)),
            "valence_by_set": {s: dict(Counter(c["valence"] for c in cs)) for s, cs in by_set.items()},
            "n_by_set": {s: len(cs) for s, cs in by_set.items()},
        }
    (HERE / "results.json").write_text(json.dumps(res, indent=1))
    print(f"coded {len(both)}; code agreement {agree_code}/{len(both)}; valence agreement {agree_val}/{len(both)}; unresolved {len(disagree)}")


if __name__ == "__main__":
    if sys.argv[1] == "prep":
        prep(sys.argv[2])
    else:
        tally()
