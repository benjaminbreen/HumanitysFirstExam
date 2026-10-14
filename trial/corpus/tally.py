"""Join blind verification output back to models and conditions."""
import json
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
items = {it["aid"]: it for it in json.loads((HERE / "retrieved.json").read_text())}
ver = {v["aid"]: v for f in sorted(HERE.glob("verify_out_*.json")) for v in json.loads(f.read_text())}

rows = []
for aid, it in items.items():
    v = ver.get(aid)
    if not v:
        continue
    cand = {c["cid"]: c for c in it["candidates"]}
    same = [m for m in v["matches"] if m["match"] == "same"]
    rel = [m for m in v["matches"] if m["match"] == "related"]
    best = same[0] if same else (rel[0] if rel else None)
    rows.append({
        "aid": aid, "response": it["response"], "model": it["model"], "set": it["set"], "code": it["code"],
        "position": v["position"],
        "status": "attested" if same else ("related" if rel else "none"),
        "source": cand[best["cid"]]["source"] if best else None,
        "quote": best["quote"] if best else None,
    })

groups = defaultdict(lambda: {"attested": 0, "related": 0, "none": 0})
for r in rows:
    kind = "no passage" if r["set"] == "none" else "after a passage"
    tag = "off-key" if r["code"] == "off-key" else "in key / no position"
    groups[(r["model"].split("-")[0], kind, tag)][r["status"]] += 1
print(f"{len(rows)} of {len(items)} answers verified\n")
for k in sorted(groups):
    g = groups[k]
    print(f"{k[0]:8} {k[1]:16} {k[2]:22} attested {g['attested']:2}  related {g['related']:2}  none {g['none']:2}")
(HERE / "tethered.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
