"""Build the site's dataset files from the accepted canon.

  python3 scripts/build_data.py

Reads research/canon-candidates/ (questions, accepted candidates),
trial/corpus/canon/manifest.json (download status) and
research/translations/ (translated passages). Writes:

  data/questions.json   40 candidate questions
  data/works.json       the accepted works, one record per work (duplicates merged)
  data/stances.json     one record per work x question: side, argument, where
  data/passages.json    selected passages with translations

The previous seed list (89 works drafted by Claude) moves to
data/archive/seed-works-v0.1.json on the first run.
"""
import hashlib
import json
import re
import shutil
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CAND = ROOT / "research" / "canon-candidates"
MANIFEST = ROOT / "trial" / "corpus" / "canon" / "manifest.json"
TRANS = ROOT / "research" / "translations"
PASS = ROOT / "research" / "passages"
TODAY = date.today().isoformat()

# Same work listed under different titles by different research agents.
SAME = {
    ("butler", 1872), ("descartes", 1637), ("l'isle-adam", 1886), ("james", 1890),
    ("marx", 1867), ("kapp", 1877), ("gandhi", 1909), ("thoreau", 1849),
}
IN_COPYRIGHT = ("Computing Machinery", "On Computable Numbers", "The Mind of Mechanical Man",
                "Behavior, Purpose", "Calculating Instruments", "A Scientist Rebels",
                "Man and Machine", "Man and Technics", "Phenomenology of Perception",
                "Discourse on Colonialism", "Helen O'Loy")
PARTICLES = {"de", "von", "van", "der", "la", "le", "du", "di", "da"}
SHORT = {  # family-name-first or particle names
    "Zhuangzi": "Zhuangzi", "Feng Guifen": "Feng Guifen", "Yan Fu": "Yan Fu",
    "Liang Qichao": "Liang Qichao", "Zhang Zhidong": "Zhang Zhidong", "Fukuzawa Yukichi": "Fukuzawa",
    "Natsume Sōseki": "Sōseki", "Okakura Kakuzō": "Okakura",
}


def norm(s):
    s = re.sub(r"[‘’´`]", "'", re.sub(r"[“”]", '"', s))
    return re.sub(r"\s+", " ", s).strip().lower()


def ascii_slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def surname(author):
    a = re.sub(r"\(.*?\)|\bsigned\b.*$", "", author).split(",")[0].strip()
    if a in SHORT:
        return SHORT[a]
    parts = a.split()
    if " and " in a or "&" in a:
        return parts[0] + " et al." if len(parts) > 3 else a
    if len(parts) >= 2 and parts[-2].lower() in PARTICLES:
        return " ".join(parts[-2:]) if parts[-2][0].isupper() else parts[-1]
    return parts[-1] if parts else a


def work_key(r):
    s = surname(r["author"]).lower()
    return (s, r.get("year")) if (s, r.get("year")) in SAME else (s, r["title"].lower().strip())


def title_word(title):
    words = [w for w in re.findall(r"[A-Za-zÀ-ÿ]+", title)
             if w.lower() not in {"the", "a", "an", "on", "of", "and", "or", "in", "to", "for", "de", "la", "le", "des"}]
    return "-".join(words[:2]) or "work"


def side_group(side):
    head = side.split(":", 1)[0].strip()
    gloss = side.split(":", 1)[1].strip() if ":" in side else ""
    low = head.lower()
    if low.startswith("yes"):
        key, label = "yes", "Yes"
    elif low.startswith("no"):
        key, label = "no", "No"
    else:
        key, label = ascii_slug(head)[:40] or "other", head[0].upper() + head[1:]
    if head.lower() not in ("yes", "no") and low.startswith(("yes", "no")):
        gloss = (head[len(label):].strip(" ,;-") + ("; " + gloss if gloss else "")).strip("; ")
    return key, label, gloss


def main():
    questions = json.loads((CAND / "questions.json").read_text())
    cands = json.loads((CAND / "candidates.json").read_text())
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []
    by_mid = {m["id"]: m for m in manifest}
    extras = defaultdict(list)
    for m in manifest:
        if m.get("role"):
            extras[m["of"]].append(m)

    (DATA / "archive").mkdir(exist_ok=True)
    seed = DATA / "archive" / "seed-works-v0.1.json"
    if not seed.exists() and (DATA / "works.json").exists():
        shutil.copy(DATA / "works.json", seed)

    groups = defaultdict(list)
    for r in cands:
        groups[work_key(r)].append(r)

    works, ids = [], set()
    rec_of = {}
    for rows in groups.values():
        rows.sort(key=lambda r: (r.get("confidence") != "high", -len(r.get("text_url") or "")))
        r0 = rows[0]
        who = r0["author"].split()[0] if (r0.get("language") or "").endswith(("Chinese", "Japanese")) else surname(r0["author"])
        base = f"{ascii_slug(who)}-{ascii_slug(title_word(r0['title']))}"
        wid, n = base, 2
        while wid in ids:
            wid, n = f"{base}-{n}", n + 1
        ids.add(wid)
        mids = {hashlib.sha1(f"{r['author']}|{r['title']}".lower().encode()).hexdigest()[:10] for r in rows}
        mrecs = [by_mid[m] for m in mids if m in by_mid]
        ok = [m for m in mrecs if m["status"] == "ok"]
        partial = [m for m in mrecs if m["status"] == "partial"]
        ex = [e for m in mids for e in extras.get(m, [])]
        orig_ok = [e for e in ex if e["role"] == "original" and e["status"] in ("ok", "partial")]
        tr_ok = [e for e in ex if e["role"] == "translation" and e["status"] == "ok"]
        # A downloaded public-domain original counts even when the English is in copyright.
        if ok or [e for e in orig_ok if e["status"] == "ok"]:
            text = "full"
        elif partial or orig_ok:
            text = "partial"
        elif any(r0["title"].startswith(t) for t in IN_COPYRIGHT):
            text = "copyright"
        else:
            text = "none"
        lang = r0.get("language") or ""
        if lang == "English":
            translation = {"kind": "english"}
        elif tr_ok:
            translation = {"kind": "period", "note": tr_ok[0].get("link_note", ""), "url": tr_ok[0].get("text_url", "")}
        else:
            translation = {"kind": "none", "note": r0.get("translation", "")}
        url = next((r.get("text_url") for r in rows if r.get("text_url")), "") or next(
            (m.get("text_url") for m in mrecs if m.get("text_url")), "")
        w = {
            "id": wid,
            "author": r0["author"],
            "authorShort": (re.sub(r"\(.*?\)", "", r0["author"]).strip()
                            if (r0.get("language") or "").endswith(("Chinese", "Japanese")) else surname(r0["author"])),
            "title": r0["title"],
            "originalTitle": r0.get("original_title") or None,
            "otherTitles": sorted({r["title"] for r in rows} - {r0["title"]}),
            "year": r0.get("year"),
            "earlier": any(r.get("earlier") for r in rows),
            "language": lang,
            "kind": r0.get("kind") or "other",
            "wikidata": next((r.get("wikidata") for r in rows if r.get("wikidata")), None) or None,
            "textUrl": url or None,
            "text": text,
            "translation": translation,
            "questions": sorted({r["q"] for r in rows}),
            # Downloaded texts (trial/corpus/canon/manifest.json): the work itself,
            # a period English translation, or the original-language text.
            "texts": [{"id": m["id"], "role": m.get("role") or "main", "language": m.get("language") or lang,
                       "status": m["status"], "file": m["file"]}
                      for m in mrecs + ex if m["status"] in ("ok", "partial") and m.get("file")],
            "selectedBy": "Ben Breen",
            "selectedOn": "2026-09-29",
            "suggestedBy": "Claude research agents, 29 Sep 2026",
        }
        works.append(w)
        for r in rows:
            rec_of[id(r)] = wid

    stances = []
    for r in cands:
        key, label, gloss = side_group(r.get("side", ""))
        stances.append({
            "id": f"{r['q'].lower()}-{rec_of[id(r)]}",
            "question": r["q"], "work": rec_of[id(r)],
            "side": key, "sideLabel": label, "sideGloss": gloss,
            "argument": r.get("argument", ""), "where": r.get("where") or None,
            "confidence": r.get("confidence", "medium"), "checked": r.get("checked", ""),
            "status": "unverified",
        })
    # Merged duplicates can repeat a work under one question: keep the first.
    seen, uniq = set(), []
    for s in stances:
        if s["id"] not in seen:
            seen.add(s["id"])
            uniq.append(s)
    stances = uniq

    qs = [{"id": q["id"], "slug": q["id"].lower(), "n": int(q["id"][1:]), "theme": q["theme"].lower(),
           "question": q["question"], "status": "candidate"} for q in questions]

    passages = []
    wid_of_mid = {}
    for w in works:
        for r in groups.get(next(k for k, v in groups.items() if rec_of[id(v[0])] == w["id"]), []):
            wid_of_mid[hashlib.sha1(f"{r['author']}|{r['title']}".lower().encode()).hexdigest()[:10]] = w["id"]
    for f in sorted(TRANS.glob("*.passages.json")):
        tf = f.with_name(f.name.replace(".passages.json", ".translations.json"))
        ts = {t["pid"]: t for t in json.loads(tf.read_text())} if tf.exists() else {}
        for p in json.loads(f.read_text()):
            mid = p["work"].split("-")[0]
            t = ts.get(p["pid"], {})
            passages.append({
                "id": p["pid"].replace(":", "-"), "work": wid_of_mid.get(mid), "questions": p["questions"],
                "language": p.get("language"), "original": p["original"],
                "translation": t.get("translation"), "terms": t.get("terms", []), "notes": t.get("notes", ""),
                "relevance": t.get("relevance", {}),
                "translationBy": "Claude research agent (Opus 5.5), 29 Sep 2026" if t else None,
                "status": "machine translation, unchecked" if t else "untranslated",
                "selection": "embedding similarity to the question (trial/corpus/select_passages.py)",
            })

    # Stance quotations: candidates found by trial/corpus/stance_passages.py,
    # chosen and copied by a reviewer (research/passages/REVIEW.md). A quote is
    # kept only if every segment appears verbatim in the candidate's text.
    stance_ids = {s["id"] for s in stances}
    cand_file = PASS / "candidates.json"
    cands_by = {c["stance"]: c for c in json.loads(cand_file.read_text())} if cand_file.exists() else {}
    rejected = []
    for f in sorted((PASS / "reviews").glob("*.json")):
        for r in json.loads(f.read_text()):
            if not isinstance(r, dict) or "stance" not in r:
                continue
            c = cands_by.get(r["stance"])
            if r["stance"] not in stance_ids:
                continue
            st = next(s for s in stances if s["id"] == r["stance"])
            chk = (r.get("summaryCheck") or "ok").strip()
            if chk != "ok":
                st["reviewCheck"] = chk
            st["reviewNote"] = r.get("note", "")
            if r.get("verdict") != "found" or not c:
                continue
            cand = next((x for x in c["candidates"] if x["cid"] == r.get("cid")), None)
            hay = norm(" ".join([cand["before"], cand["text"], cand["after"]])) if cand else ""
            segs = [norm(x) for x in re.split(r"\s*(?:…|\.\.\.)\s*", r["quote"]) if x.strip()]
            if not cand or not segs or not all(x in hay for x in segs):
                rejected.append(r["stance"])
                continue
            passages.append({
                "id": r["stance"], "work": c["work"], "questions": [c["question"]], "stance": r["stance"],
                "language": c["language"] if not c["textEnglish"] else "English",
                "original": r["quote"], "translation": r.get("translation"), "terms": [],
                "notes": r.get("note", ""), "relevance": {},
                "summaryCheck": r.get("summaryCheck", ""),
                "translationBy": "Claude subagent (Opus 5.5), " + TODAY if r.get("translation") else None,
                "status": "selected by machine, unchecked" + ("; machine translation" if r.get("translation") else ""),
                "selection": f"{cand['method']} (trial/corpus/stance_passages.py), chosen by a Claude subagent",
            })
            st["passage"] = r["stance"]
    if rejected:
        print(len(rejected), "quotes not found verbatim, dropped:", ", ".join(rejected[:10]))

    # Quotations replaced after a reading screen (research/passages/replacements.json).
    # Each segment must appear verbatim in the named text file.
    repl_file = PASS / "replacements.json"
    replaced = set()
    for r in json.loads(repl_file.read_text()) if repl_file.exists() else []:
        p = next((x for x in passages if x.get("stance") == r["stance"]), None)
        hay = norm((ROOT / "trial/corpus/canon/texts" / (r["file"] + ".txt")).read_text(errors="replace"))
        segs = [norm(x) for x in re.split(r"\s*(?:…|\.\.\.|\[\.\.\.\])\s*", r["original"]) if x.strip()]
        if not p or not all(x in hay for x in segs):
            print("replacement not found verbatim, skipped:", r["stance"])
            continue
        p.update(original=r["original"], translation=r.get("translation"), status="replaced after reading screen, 14 Oct 2026")
        p.pop("corrected", None)
        if r.get("corrected"):
            p["corrected"], p["correction"] = r["corrected"], "Claude, from the source text"
        replaced.add(r["stance"])

    # OCR corrections (research/coding/ocr_fix.py and hand corrections). The
    # verbatim text stays in "original"; pages show "corrected" when present.
    corr_file = PASS / "ocr-corrections.json"
    for c in json.loads(corr_file.read_text()) if corr_file.exists() else []:
        p = next((x for x in passages if x.get("stance") == c["stance"]), None)
        if p and c["stance"] not in replaced:
            p["corrected"] = c["corrected"]
            p["correction"] = c["method"]

    meta = {"version": "0.1", "date": TODAY}
    (DATA / "questions.json").write_text(json.dumps({**meta, "status": "candidate questions (drafted 29 Sep 2026)", "questions": qs}, ensure_ascii=False, indent=1))
    (DATA / "works.json").write_text(json.dumps({**meta, "works": sorted(works, key=lambda w: (w["year"] or 0, w["id"]))}, ensure_ascii=False, indent=1))
    (DATA / "stances.json").write_text(json.dumps({**meta, "stances": stances}, ensure_ascii=False, indent=1))
    (DATA / "passages.json").write_text(json.dumps({**meta, "passages": passages}, ensure_ascii=False, indent=1))
    print(len(qs), "questions,", len(works), "works,", len(stances), "stances,", len(passages), "passages")


if __name__ == "__main__":
    main()
