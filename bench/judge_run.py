#!/usr/bin/env python3
"""Judge every draw in a runs file with a non-Qwen model.

Usage: python3 judge_run.py reckoning/runs/qwen3.7-plus.json
Writes reckoning/judged/<runfile-stem>_judged.json, saving as it goes.
"""
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

JUDGE_MODEL = "google/gemini-3.5-flash-lite"

runs_path = Path(sys.argv[1])
folder = runs_path.parent.parent
out_path = folder / "judged" / f"{runs_path.stem}_judged.json"

rubric = (folder / "judge.md").read_text().split("---", 1)[1].strip()
draws = json.loads(runs_path.read_text())["draws"]

def call(prompt):
    body = json.dumps({
        "model": JUDGE_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]

def parse(reply):
    m = re.search(r"\{.*\}", reply, re.DOTALL)
    return json.loads(m.group(0))

out_path.parent.mkdir(exist_ok=True)
judged = json.loads(out_path.read_text())["judged"] if out_path.exists() else []
done_ids = {j["id"] for j in judged}

for n, d in enumerate(draws):
    if d["id"] in done_ids:
        continue
    prompt = rubric + "\n\nThe response to code:\n\n" + d["text"]
    for attempt in range(3):
        try:
            coded = parse(call(prompt))
            break
        except Exception:
            if attempt == 2:
                coded = {"verdict": "JUDGE-ERROR", "quote": "", "ground": "", "groundQuote": "", "notes": ""}
            time.sleep(8)
    coded = {
        "id": d["id"],
        "model": d["model"],
        "condition": d["condition"],
        "dossier": d.get("dossier"),
        **{k: coded.get(k, "") for k in ("verdict", "quote", "ground", "groundQuote", "notes")},
        "judge": JUDGE_MODEL,
    }
    judged.append(coded)
    out_path.write_text(json.dumps({"judged": judged}, indent=1, ensure_ascii=False))
    print(f"{len(judged)}/{len(draws)}", flush=True)
    time.sleep(0.5)
