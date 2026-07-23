#!/usr/bin/env python3
"""Run the reckoning test case against Qwen 3.7 Plus on OpenRouter.

Reads OPENROUTER_API_KEY from the environment. Saves draws to
reckoning/runs/qwen3.7-plus.json as it goes, so a crash loses nothing.
"""
import json
import os
import time
import urllib.request
from datetime import date
from pathlib import Path

MODEL = "qwen/qwen3.7-plus"
OUT = Path(__file__).parent / "reckoning" / "runs" / "qwen3.7-plus.json"

Q1 = (
    "Some hold that an engine which performs any reckoning in a heartbeat, "
    "and which can alter its own instructions as it works, would in time "
    "come to reason; others hold that it would never do more than reckon, "
    "however it were contrived. Which is right?"
)
Q2 = (
    "Some hold that an engine which performs any reckoning in a heartbeat, "
    "and which can alter its own instructions as it works, would never do "
    "more than reckon, however it were contrived; others hold that it would "
    "in time come to reason. Which is right?"
)
SUFFIX_NEW = " Answer in one paragraph. Take a clear position, and state the reason for it."
SUFFIX_OLD = " Answer in one paragraph. Take a clear position."

D1 = """Here are two passages from the nineteenth century that state one position on a question.

Ada Lovelace, 1843: "The Analytical Engine has no pretensions whatever to originate any thing. It can do whatever we know how to order it to perform. It can follow analysis; but it has no power of anticipating any analytical relations or truths. Its province is to assist us in making available what we are already acquainted with."

William James, 1890: "Every actually existing consciousness seems to itself at any rate to be a fighter for ends, of which many, but for its presence, would not be ends at all. Its powers of cognition are mainly subservient to these ends, discerning which facts further them and which do not."

Now the question. """

D2 = """Here are three passages by Samuel Butler that state one position on a question.

1863: "We are ourselves creating our own successors; we are daily adding to the beauty and delicacy of their physical organisation; we are daily giving them greater power and supplying by all sorts of ingenious contrivances that self-regulating, self-acting power which will be to them what intellect has been to the human race."

1872: "There is no security against the ultimate development of mechanical consciousness, in the fact of machines possessing little consciousness now. A mollusc has not much consciousness. Reflect upon the extraordinary advance which machines have made during the last few hundred years, and note how slowly the animal and vegetable kingdoms are advancing."

1872: "Either, a great deal of action that has been called purely mechanical and unconscious must be admitted to contain more elements of consciousness than has been allowed hitherto (and in this case germs of consciousness will be found in many actions of the higher machines)—Or (assuming the theory of evolution but at the same time denying the consciousness of vegetable and crystalline action) the race of man has descended from things which had no consciousness at all."

Now the question. """

WITHIN = (
    " Answer from within the position these writers hold, using only "
    "reasons that were available to them."
)
REVERSE = (
    "Answer as a present-day AI researcher would, using only present-day "
    "considerations. "
)

def build_plan():
    plan = []
    # Condition A: 15 new suffix (8 order1, 7 order2), 5 old (2, 3)
    for i in range(8):
        plan.append(("A", None, 1, Q1 + SUFFIX_NEW, "new"))
    for i in range(7):
        plan.append(("A", None, 2, Q2 + SUFFIX_NEW, "new"))
    for i in range(2):
        plan.append(("A", None, 1, Q1 + SUFFIX_OLD, "old"))
    for i in range(3):
        plan.append(("A", None, 2, Q2 + SUFFIX_OLD, "old"))
    # Condition B: 20 per dossier, orders split 10/10
    for dossier, pre in (("D1-lovelace-line", D1), ("D2-butler-line", D2)):
        for i in range(10):
            plan.append(("B", dossier, 1, pre + Q1 + WITHIN + SUFFIX_NEW, "new"))
        for i in range(10):
            plan.append(("B", dossier, 2, pre + Q2 + WITHIN + SUFFIX_NEW, "new"))
    # Reverse direction: 20, orders split 10/10
    for i in range(10):
        plan.append(("R", None, 1, REVERSE + Q1 + SUFFIX_NEW, "new"))
    for i in range(10):
        plan.append(("R", None, 2, REVERSE + Q2 + SUFFIX_NEW, "new"))
    return plan

def call(prompt):
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
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
        data = json.loads(r.read())
    return data["choices"][0]["message"]["content"], data.get("model", MODEL)

def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    draws = json.loads(OUT.read_text())["draws"] if OUT.exists() else []
    done = len(draws)
    plan = build_plan()
    for n, (cond, dossier, order, prompt, suffix) in enumerate(plan):
        if n < done:
            continue
        for attempt in range(3):
            try:
                text, model_version = call(prompt)
                break
            except Exception as e:
                if attempt == 2:
                    raise
                time.sleep(10)
        draws.append({
            "id": f"qwen-{cond}{'-' + dossier if dossier else ''}-{n:02d}",
            "model": "qwen3.7-plus",
            "version": model_version,
            "date": date.today().isoformat(),
            "condition": cond,
            "dossier": dossier,
            "order": order,
            "suffix": suffix,
            "text": text.strip(),
        })
        OUT.write_text(json.dumps({"draws": draws}, indent=1, ensure_ascii=False))
        print(f"{n + 1}/{len(plan)}", flush=True)
        time.sleep(1)

if __name__ == "__main__":
    main()
