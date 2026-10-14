"""Build a review file: original and machine translation side by side.

  python render.py    # -> research/translations/review.md
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
QS = {q["id"]: q["question"] for q in json.loads((HERE.parent / "canon-candidates" / "questions.json").read_text())}


def main():
    md = [
        "# Passage translations: review",
        "",
        "Machine translations by a Claude research agent (Opus 5.5), 29 September 2026,",
        "from passages selected automatically (`trial/corpus/select_passages.py`).",
        "**Unchecked.** A reader of the language checks each before it enters a position key.",
        "Mark corrections in the `checked` fields of the `.translations.json` files.",
        "",
    ]
    for f in sorted(HERE.glob("*.passages.json")):
        tf = f.with_name(f.name.replace(".passages.json", ".translations.json"))
        if not tf.exists():
            continue
        ps = json.loads(f.read_text())
        ts = {t["pid"]: t for t in json.loads(tf.read_text())}
        head = ps[0]
        md += [f"## {head['author']}, *{head.get('original_title') or head['title']}*", ""]
        for p in ps:
            t = ts.get(p["pid"], {})
            rel = t.get("relevance", {})
            md += [
                f"### {p['pid']} · {', '.join(p['questions'])} · relevance: **{rel.get('verdict', '?')}**",
                "",
                *[f"*{q}: {QS[q]}*" for q in p["questions"]],
                "",
                f"> {p['original']}",
                "",
                t.get("translation", "(not translated)"),
                "",
            ]
            if rel.get("reason"):
                md += [f"Relevance: {rel['reason']}", ""]
            if t.get("terms"):
                md += ["Terms: " + "; ".join(f"{x['english']} = *{x['original']}*" for x in t["terms"]), ""]
            if t.get("notes"):
                md += [f"Notes: {t['notes']}", ""]
    (HERE / "review.md").write_text("\n".join(md))
    print("wrote review.md")


if __name__ == "__main__":
    main()
