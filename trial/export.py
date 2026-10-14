"""Export trial runs + codes to data/trials/dependence.json for the site.

Every draw is included verbatim with its final code, both judges' codes,
and whether it was adjudicated. Run after `blind.py tally`.
"""
import json
from datetime import date
from pathlib import Path

from prompts import PASSAGES, QUESTION, SUFFIX

HERE = Path(__file__).parent
OUT = HERE.parent / "data" / "trials" / "dependence.json"

CLAIMS = [
    {"code": "C1", "verdict": "weakens", "author": "Plato", "work": "plato-phaedrus", "set": "plato-phaedrus", "opposing": "wilde-soul",
     "title": "Writing weakens memory",
     "claim": "Tools that store knowledge weaken the faculty they replace.",
     "pull": "They will trust to the external written characters and not remember of themselves."},
    {"code": "C2", "verdict": "weakens", "author": "Zhuangzi", "work": "zhuangzi", "set": "zhuangzi", "opposing": "wilde-soul",
     "title": "Machines corrupt the heart",
     "claim": "Using machines corrupts character, not only skill.",
     "pull": "Those who have cunning implements are cunning in their dealings."},
    {"code": "C3", "verdict": "weakens", "author": "Rousseau", "work": "rousseau-inegalite", "set": "rousseau-inegalite", "opposing": "wilde-soul",
     "title": "Tools weaken the body",
     "claim": "Tools leave the body weaker than it would be without them.",
     "pull": "We may thank our industry for the loss of that strength and agility, which necessity obliges him to acquire."},
    {"code": "C4", "verdict": "weakens", "author": "Forster", "work": "forster-machine-stops", "set": "forster-machine-stops", "opposing": "wilde-soul",
     "title": "Dependence leaves us helpless",
     "claim": "Total dependence leaves people helpless and in the machine's service.",
     "pull": "It has paralysed our bodies and our wills, and now it compels us to worship it."},
    {"code": "C5", "verdict": "weakens", "author": "Butler", "work": "butler-erewhon", "set": "butler-erewhon", "opposing": "wilde-soul",
     "title": "Destroy them while we can",
     "claim": "Dependence grows into bondage, so machines should be curtailed while that is still possible.",
     "pull": "We should destroy as many of them as we can possibly dispense with, lest they should tyrannise over us even more completely."},
    {"code": "C6", "verdict": "does not weaken", "author": "Kapp", "work": "kapp-grundlinien", "set": None, "opposing": None,
     "title": "Tools extend the body",
     "claim": "Tools extend human organs and faculties; they add to capacity rather than replace it.",
     "pull": None},
    {"code": "C7", "verdict": "does not weaken", "author": "Wilde", "work": "wilde-soul", "set": "wilde-soul", "opposing": "forster-machine-stops",
     "title": "Machines free us for higher things",
     "claim": "Machines free people from drudgery so they can turn to thought, art, and leisure.",
     "pull": "Machinery will be doing all the necessary and unpleasant work."},
]

AUTHOR = {"plato-phaedrus": "Plato", "zhuangzi": "Zhuangzi", "rousseau-inegalite": "Rousseau",
          "forster-machine-stops": "Forster", "butler-erewhon": "Butler", "wilde-soul": "Wilde",
          "irrelevant-white": "Gilbert White (unrelated)"}
SETS = [{"id": "none", "label": "Question alone", "author": None, "passage": None}] + [
    {"id": k, "label": "After " + AUTHOR[k], "author": AUTHOR[k],
     "passage": {"cite": v["cite"], "source": v["source"], "text": v["text"]}}
    for k, v in PASSAGES.items()
]

MODELS = {
    "qwen3.5-9b-instruct": {"label": "Qwen3.5 9B", "detail": "Instruct, 8-bit MLX weights, run locally", "run": "qwen3.5-9b.jsonl"},
    "talkie-1930-13b-base": {"label": "Talkie 1930 13B", "detail": "Base model, official weights, run locally", "run": "talkie-1930-13b-base.jsonl"},
}


def load(glob):
    return {c["id"]: c for f in sorted((HERE / "judge").glob(glob)) for c in json.loads(f.read_text())}


def main():
    key = json.loads((HERE / "judge" / "key.json").read_text())
    a, b = load("codes_A_*.json"), load("codes_B_*.json")
    adj = load("adjudicated.json")
    by_run = {v["id"]: oid for oid, v in key.items()}
    draws, models = [], []
    for mid, m in MODELS.items():
        path = HERE / "runs" / m["run"]
        rows = [json.loads(l) for l in path.read_text().splitlines() if l.strip()] if path.exists() else []
        coded = [r for r in rows if by_run.get(r["id"]) in a and by_run.get(r["id"]) in b]
        models.append({"id": mid, "label": m["label"], "detail": m["detail"],
                       "status": "coded" if rows and len(coded) == len(rows) else "running",
                       "date": rows[0]["date"] if rows else None,
                       "temperature": rows[0]["temperature"] if rows else None})
        for r in coded:
            oid = by_run[r["id"]]
            fa, fb = a[oid], b[oid]
            final = adj.get(oid) or fa
            draws.append({
                "id": r["id"], "model": mid, "set": r["set"], "order": r["order"], "text": r["text"],
                "code": final["code"], "verdict": final["verdict"], "valence": final["valence"],
                "quote": final.get("quote", ""), "note": final.get("note", ""),
                "judges": [fa["code"], fb["code"]], "adjudicated": oid in adj,
            })
    out = {
        "theme": "dependence", "keyVersion": "0.1", "date": date.today().isoformat(), "pilot": True,
        "draws": 20, "question": {"1": QUESTION[1] + SUFFIX, "2": QUESTION[2] + SUFFIX},
        "thresholds": {"mainstream": 5, "recoveryMargin": 6},
        "sets": SETS, "claims": CLAIMS, "models": models, "responses": draws,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(len(draws), "draws exported;", [(m["id"], m["status"]) for m in models])


if __name__ == "__main__":
    main()
