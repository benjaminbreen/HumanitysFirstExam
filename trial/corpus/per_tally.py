"""Combine canon and periodical matching into one status per answer."""
import json
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
prior = {r["response"]: r for r in json.loads((HERE / "tethered.json").read_text())}
items = {it["aid"]: it for it in json.loads((HERE / "per_retrieved.json").read_text())}
ver = {v["aid"]: v for f in sorted(HERE.glob("per_verify_out_*.json")) for v in json.loads(f.read_text())}

per = {}
for aid, it in items.items():
    v = ver.get(aid)
    if not v:
        continue
    cand = {c["cid"]: c for c in it["candidates"]}
    same = [m for m in v["matches"] if m["match"] == "same"]
    rel = [m for m in v["matches"] if m["match"] == "related"]
    best = same[0] if same else (rel[0] if rel else None)
    per[it["response"]] = {
        "status": "attested" if same else ("related" if rel else "none"),
        "position": v["position"],
        "source": cand[best["cid"]]["source"] if best else None,
        "quote": best["quote"] if best else None,
    }

rows = []
for resp, r in prior.items():
    p = per.get(resp)
    final = "attested" if r["status"] == "attested" or (p and p["status"] == "attested") else (
        "related" if r["status"] == "related" or (p and p["status"] == "related") else "none")
    where = "canon" if r["status"] == "attested" else ("periodicals" if p and p["status"] == "attested" else None)
    rows.append({**r, "final": final, "where": where,
                 "per_source": p["source"] if p else None, "per_quote": p["quote"] if p else None,
                 "per_position": p["position"] if p else None})

print(f"periodical verification: {len(per)} of {len(items)} answers\n")
for m in ("qwen", "talkie"):
    rs = [r for r in rows if r["model"].startswith(m)]
    c = Counter(r["final"] for r in rs)
    w = Counter(r["where"] for r in rs if r["where"])
    print(f"{m:7} {len(rs):3} answers  attested {c['attested']:2} (canon {w['canon']}, periodicals {w['periodicals']})"
          f"  related {c['related']:2}  none {c['none']:2}")
(HERE / "tethered_all.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
