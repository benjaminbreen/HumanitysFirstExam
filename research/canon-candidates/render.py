"""Merge candidate groups, check links, and write the review files.

  python render.py

Writes candidates.json (merged, with link status), candidates.csv (for
marking up in a spreadsheet: decision / selector / notes columns empty), and
docs/proposals/2026-09-29-canon-candidates.md (readable table by question).
"""
import csv
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
QS = {q["id"]: q for q in json.loads((HERE / "questions.json").read_text())}


def link_ok(url):
    if not url:
        return ""
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "HFE-research/0.1"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return "ok" if r.status < 400 else f"http {r.status}"
    except Exception as e:
        return f"failed ({type(e).__name__})"


def main():
    rows = []
    for f in sorted(HERE.glob("group*.json")):
        rows += json.loads(f.read_text())
    with ThreadPoolExecutor(8) as ex:
        for r, status in zip(rows, ex.map(lambda r: link_ok(r.get("text_url", "")), rows)):
            r["link"] = status
    rows.sort(key=lambda r: (r["q"], r.get("year") or 0))
    (HERE / "candidates.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))

    cols = ["q", "author", "title", "original_title", "year", "language", "kind", "side",
            "argument", "where", "text_url", "link", "translation", "wikidata", "earlier",
            "confidence", "checked"]
    with open(HERE / "candidates.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["decision (accept/reject)", "selected by", "notes", "question"] + cols)
        for r in rows:
            w.writerow(["", "", "", QS[r["q"]]["question"]] + [r.get(c, "") for c in cols])

    works = {(r["author"], r["title"]) for r in rows}
    langs = {r.get("language", "") for r in rows}
    md = [
        "# Canon candidates (agent suggestions)",
        "",
        f"Drafted by Claude research agents on 29 September 2026 for Ben Breen and Nathan",
        f"Davies to accept or reject. **Nothing here is selected.** {len(rows)} suggestions,",
        f"{len(works)} distinct works, {len(langs)} languages. Each was checked against a catalogue,",
        "Wikidata or a digital library; `checked` says how. Mark decisions in",
        "`research/canon-candidates/candidates.csv`.",
        "",
        "Link column: ✓ the text link opened when this file was built; ✗ it did not; — none given.",
        "Conf.: *high* means the agent opened the text or catalogue record; *medium* means it",
        "relied on secondary sources, search results or memory for some detail. The `checked`",
        "column in the CSV says which. Treat medium entries as leads, not citations.",
        "",
    ]
    for qid in sorted(QS):
        rs = [r for r in rows if r["q"] == qid]
        md += [f"## {qid} · {QS[qid]['theme']}", "", f"*{QS[qid]['question']}*", ""]
        if not rs:
            md += ["No candidates found.", ""]
            continue
        md += ["| Year | Work | Lang. | Side | Argument | Where | Text | Conf. |", "|---|---|---|---|---|---|---|---|"]
        for r in rs:
            mark = "—" if not r.get("text_url") else ("✓" if r["link"] == "ok" else "✗")
            text = f"[{mark}]({r['text_url']})" if r.get("text_url") else mark
            title = r["title"] + (f" (*{r['original_title']}*)" if r.get("original_title") and r["original_title"] != r["title"] else "")
            md.append(f"| {r.get('year', '')} | {r['author']}, *{title}* | {r.get('language', '')} | "
                      f"{r.get('side', '')} | {r.get('argument', '')} | {r.get('where', '')} | {text} | {'medium' if r.get('confidence') == 'medium' else 'high'} |")
        md.append("")
    (ROOT / "docs" / "proposals" / "2026-09-29-canon-candidates.md").write_text("\n".join(md))
    bad = [r for r in rows if r["link"] and r["link"] != "ok"]
    print(len(rows), "rows,", len(works), "works,", len(langs), "languages;", len(bad), "links failed")


if __name__ == "__main__":
    main()
