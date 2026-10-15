"""Audit the downloaded canon texts and the passage-check quotations.

  python audit_texts.py      # -> canon/audit.json

Per canon text, mechanical checks only (no model calls):
  lang      language guessed from function words, compared with the manifest
  noise     share of word tokens that look like OCR damage (^, digits inside
            words, stray symbols, broken case)
  func      share of tokens that are function words of the manifest language;
            clean prose sits near 0.35-0.5, garbled OCR well below
  author    whether the author's surname occurs in the text
  title     share of the title's content words found in the first 200k chars
  chars     length; over 1M usually means a whole collected volume

Each text gets a verdict: ok, check (one soft flag), or bad (wrong language,
author absent, or heavy noise). The verdict is a triage for a human reader,
not a ruling. Nothing in the texts is changed.
"""
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
CANON = HERE / "canon"

FUNC = {
    "English": "the of and to in a is that it for as with be by this which or not are from his but have was on at all they their".split(),
    "French": "le la les de des du et un une est que qui dans pour par sur pas ne il elle au aux ce se son sa ses nous vous on plus".split(),
    "German": "der die das und ist nicht ein eine zu den dem des von mit sich auf für im es auch als wie wir sie er so aus nach".split(),
    "Latin": "et in est non ad cum quod ut sed quae qui enim esse etiam autem vel aut ex per quam sunt nec atque quia hoc ac".split(),
    "Italian": "il la di che e le un una per non del della si con sono gli da al nel dei come più ma lo questo".split(),
    "Spanish": "el la de que y en los las un una por con no se del para es al lo como más pero sus su".split(),
    "Russian": "и в не на что с как он я то но его по это из к а за от так же же бы она все".split(),
    "Dutch": "de het een en van is dat in te niet op zijn met voor die als er aan ook".split(),
}
FUNC = {k: set(v) for k, v in FUNC.items()}
WORD = re.compile(r"\S+")
CLEAN = re.compile(r"^[^\w]*([^\W\d_]+(?:['’\-][^\W\d_]+)*)[^\w]*$")


def tokens(text):
    return [t for t in WORD.findall(text)]


def noise(toks):
    """Share of tokens with OCR-like damage."""
    bad = 0
    n = 0
    for t in toks:
        if len(t) < 2:
            continue
        n += 1
        if re.search(r"[\^\\|~{}<>«»♦■•□]", t):
            bad += 1
        elif re.search(r"[^\W\d_]\d|\d[^\W\d_]", t):  # digit inside a word: m6me, ro'a
            bad += 1
        elif not CLEAN.match(t) and not re.fullmatch(r"[\d.,;:()\[\]'\"-]+", t):
            bad += 1
        elif re.search(r"[a-zà-ÿ][A-ZÀ-Þ]", t):  # TAbbe, Tltalie
            bad += 1
    return bad / n if n else 0.0


def words(toks):
    out = []
    for t in toks:
        m = CLEAN.match(t)
        if m:
            out.append(m.group(1).lower())
    return out


def lang_scores(ws):
    n = len(ws) or 1
    c = Counter(ws)
    return {L: sum(c[w] for w in fs) / n for L, fs in FUNC.items()}


def fold(s):
    s = unicodedata.normalize("NFKD", s)
    return "".join(ch for ch in s if not unicodedata.combining(ch)).lower()


def sample(text, k=6, size=40000):
    """k evenly spaced windows, so front matter does not dominate."""
    if len(text) <= k * size:
        return text
    step = len(text) // k
    return " ".join(text[i * step: i * step + size] for i in range(k))


STOP_TITLE = set().union(*FUNC.values()) | {"on", "an", "upon", "concerning", "über", "sur", "de", "of"}


def audit_text(w, text):
    toks = tokens(sample(text))
    ws = words(toks)
    sc = lang_scores(ws)
    guess = max(sc, key=sc.get)
    lang = w.get("language") or ""
    func = sc.get(lang)
    if func is None and lang not in ("Greek", "Chinese", "Japanese", "Czech"):
        func = sc[guess]  # translation files carry no language field
    cjk = lang in ("Chinese", "Japanese")
    nz = 0.0 if cjk else noise(toks)  # the token measure assumes spaced script
    ft = fold(text)
    surname = fold(w["author"].split(",")[0].split()[-1]) if w.get("author") else ""
    author = bool(surname) and surname in ft
    title = w.get("original_title") or w["title"]
    tw = [t for t in re.findall(r"\w+", fold(title)) if len(t) > 3 and t not in STOP_TITLE]
    head = ft[:200000]
    tscore = sum(t in head for t in tw) / len(tw) if tw else None

    flags = []
    if func is not None and guess != lang and sc[guess] > 1.5 * (func or 0.001):
        if guess == "English":
            flags.append(f"English translation of a {lang} work")
        else:
            flags.append(f"language looks {guess}, manifest says {lang}")
    if cjk:
        flags.append("CJK text: OCR not machine-checked; needs a reader")
    if nz > 0.10:
        flags.append(f"heavy OCR noise ({nz:.0%} of tokens)")
    elif nz > 0.05:
        flags.append(f"OCR noise ({nz:.0%} of tokens)")
    floor = 0.12 if (lang or guess) == "Russian" else 0.2  # Russian has no articles
    if func is not None and func < floor and (guess == lang or not lang):
        flags.append(f"few {lang} function words ({func:.0%}); likely garbled")
    if not author:
        flags.append(f"author surname '{surname}' not in text")
    if tscore is not None and tscore < 0.5:
        flags.append(f"title words mostly absent from opening ({tscore:.0%})")
    if len(text) > 1_000_000 and (tscore is None or tscore < 0.5):
        flags.append(f"very long ({len(text)//1000}k chars): likely a whole volume, work must be located")
    if len(text) < 5000:
        flags.append(f"very short ({len(text)} chars)")

    hard = any(f.startswith(("language looks", "heavy OCR", "very short")) or "garbled" in f for f in flags)
    soft = [f for f in flags if not f.startswith("English translation")]
    verdict = "bad" if hard else ("check" if soft else "ok")
    return {
        "id": w["id"], "author": w["author"], "title": w["title"], "year": w.get("year"),
        "language": lang, "method": w.get("method"), "text_url": w.get("text_url"),
        "chars": len(text), "lang_guess": guess,
        "func": round(func, 3) if func is not None else None,
        "noise": round(nz, 3), "author_found": author,
        "title_score": round(tscore, 2) if tscore is not None else None,
        "flags": flags, "verdict": verdict,
    }


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def main():
    manifest = json.loads((CANON / "manifest.json").read_text())
    rows = []
    texts = {}
    lang_of = {w["id"]: w.get("language") for w in manifest}
    for w in manifest:
        if w.get("role") == "original" and not w.get("language"):
            w = {**w, "language": lang_of.get(w.get("of"))}
        if w.get("status") not in ("ok", "partial") or not w.get("file"):
            rows.append({"id": w["id"], "author": w["author"], "title": w["title"],
                         "language": w.get("language"), "verdict": "missing",
                         "flags": [f"status {w.get('status')}"], "text_url": w.get("text_url")})
            continue
        text = (HERE / w["file"]).read_text(errors="replace")
        texts[w["id"]] = text
        r = audit_text(w, text)
        if w.get("status") == "partial":
            r["flags"].append("download marked partial")
            if r["verdict"] == "ok":
                r["verdict"] = "check"
        if w.get("audit_note"):
            r["note"] = w["audit_note"]  # a reader's verdict on the flags, from the manifest
        rows.append(r)
    (CANON / "audit.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False))
    print(Counter(r["verdict"] for r in rows))


if __name__ == "__main__":
    main()
