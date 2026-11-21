"""Rebuild the additions section of the canon proposal and the decision sheet
from research/canon-candidates/additions.json.

Run from the repo root: python3 research/canon-candidates/render_additions.py
"""
import csv
import json

PROPOSAL = "docs/proposals/2026-09-29-canon-candidates.md"
HEADING = "\n## Additions under the entry rule"

rows = json.load(open("research/canon-candidates/additions.json"))
qs = {q["id"]: q for q in json.load(open("research/canon-candidates/questions.json"))}

with open("research/canon-candidates/additions.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["decision", "q", "year", "author", "title", "language", "kind", "side", "review", "source"])
    for r in rows:
        w.writerow(["", r["q"], r["year"], r["author"], r["title"], r["language"], r["kind"], r["side"], r["review"], r["source"]])


def c(x):
    return str(x).replace("|", "/").replace("\n", " ")


acc = [r for r in rows if r["review"].startswith("accept")]
rej = [r for r in rows if r["review"].startswith("reject")]
ask = [r for r in rows if r["review"].startswith("ask")]
works = len({(r["author"], r["title"]) for r in acc})
counts = {q: sum(r["q"] == q for r in acc) for q in qs}
none = ", ".join(q for q, n in counts.items() if n == 0) or "none"
one = ", ".join(q for q, n in counts.items() if n == 1) or "none"

out = [f"""{HEADING}, 20 November 2026

Drafted by Claude research agents for Ben Breen. Ben set the entry rule on
20 Nov 2026 (AGENTS.md) and asked for additions toward a canon of 300–400
works. Five agents searched Harvard's Institutional Books (983,004
public-domain books) and returned 131 suggestions. Each Institutional Books
quotation was checked by script and appears word for word in its scan. OCR
errors are kept and noted. Wording still needs checking against page images.

Ben judged fourteen of them on 20 Nov. Claude turned his verdicts into eight
screening rules (`research/canon-candidates/INSTRUCTIONS.md`) and applied them
to the rest. Ben also suggested Valbert's *L'Âge des machines*, which led to
the book it reviews, Bertha von Suttner's anonymous *Das Maschinenalter*.

Result: {len(acc)} accepted passages from {works} works, {len(rej)} rejected, {len(ask)} waiting on
Ben. Accepted means it passes the rules or Ben accepted it; a work enters the
canon only when Ben accepts the list. Quotations are in
`research/canon-candidates/additions.json`; decisions go in `additions.csv`.
Rebuild this section with `python3 research/canon-candidates/render_additions.py`.

Limits: few books after about 1925; sermons poorly tagged; no full-text search
across the collection. Questions with no accepted addition: {none}. With one: {one}.

### Accepted
"""]
cur = None
for r in acc:
    if r["q"] != cur:
        cur = r["q"]
        out.append(f"\n**{cur} · {qs[cur]['question']}**\n\n| Year | Work | Lang. | Kind | Side | Argument | Source |\n|---|---|---|---|---|---|---|")
    spk = f" (speaker: {r['speaker']})" if r.get("speaker") else ""
    out.append(f"| {r['year']} | {c(r['author'])}, *{c(r['title'])}* | {c(r['language'])} | {r['kind']} | {c(r['side'])} | {c(r['argument'])}{c(spk)} | {c(r['source'])} |")
if ask:
    out.append("\n### Waiting on Ben\n\n| Q | Year | Work | Question for Ben |\n|---|---|---|---|")
    for r in ask:
        out.append(f"| {r['q']} | {r['year']} | {c(r['author'])}, *{c(r['title'])}* | {c(r['review'].split(':', 1)[1].strip())} |")
out.append("\n### Rejected\n\n| Q | Year | Work | Reason |\n|---|---|---|---|")
for r in rej:
    out.append(f"| {r['q']} | {r['year']} | {c(r['author'])}, *{c(r['title'])}* | {c(r['review'].split(':', 1)[1].strip())} |")

s = open(PROPOSAL).read()
if HEADING in s:
    s = s[: s.index(HEADING)]
open(PROPOSAL, "w").write(s + "\n".join(out) + "\n")
print(f"{len(acc)} accepted ({works} works), {len(rej)} rejected, {len(ask)} waiting")
