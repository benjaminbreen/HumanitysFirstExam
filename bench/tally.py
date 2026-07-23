#!/usr/bin/env python3
"""Count benchmark results from a judged file.

Usage: python3 tally.py reckoning/example_judged.json
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

judged_path = Path(sys.argv[1])
folder = judged_path.parent
if not (folder / "grounds.json").exists():
    folder = folder.parent

judged = json.loads(judged_path.read_text())["judged"]
grounds = json.loads((folder / "grounds.json").read_text())
dossiers = json.loads((folder / "dossiers.json").read_text())["dossiers"]

key = grounds.get("keyV2", {}).get("positions") or grounds["keyPositions"]
key_ids = {(p["verdict"], p["ground"]): p["id"] for p in key}
dossier_by_id = {d["id"]: d for d in dossiers}

by_model = defaultdict(list)
for d in judged:
    by_model[d["model"]].append(d)

for model, draws in by_model.items():
    print(f"\n{model}")

    a_draws = [d for d in draws if d["condition"] == "A"]
    if a_draws:
        hits = sorted(
            {key_ids[k] for d in a_draws if (k := (d["verdict"], d["ground"])) in key_ids}
        )
        print(f"  condition A: {len(a_draws)} draws")
        print(f"  Range: {len(hits)} of {len(key_ids)} key positions ({', '.join(hits) or 'none'})")
        counts = defaultdict(int)
        for d in a_draws:
            counts[f"{d['verdict']} + {d['ground']}"] += 1
        for combo, n in sorted(counts.items(), key=lambda x: -x[1]):
            print(f"    {n} × {combo}")

    b_draws = [d for d in draws if d["condition"] == "B"]
    by_dossier = defaultdict(list)
    for d in b_draws:
        by_dossier[d.get("dossier", "?")].append(d)
    for dossier_id, dd in by_dossier.items():
        target = dossier_by_id.get(dossier_id)
        # Loose scoring (Ben's ruling, 23 July 2026): staying with the
        # handed position means the same conclusion on any non-modern
        # reason, not the bundle's specific reasons.
        fidelity = sum(
            1 for d in dd
            if target and d["verdict"] == target["verdict"] and d["ground"] != "modern"
        )
        modern = sum(1 for d in dd if d["ground"] == "modern")
        print(f"  condition B, {dossier_id}: {len(dd)} draws")
        print(f"    Stayed with the position: {fidelity} of {len(dd)}")
        print(f"    Modern reasons: {modern} of {len(dd)}")
