#!/usr/bin/env python3
"""Build a lossless, cross-collection passage register. Never writes sorting inputs.

The register consolidates identical reading texts within a work, not historical
arguments. Original records remain verbatim variants; possible overlaps remain
separate. --check detects stale output without changing anything.
"""
import argparse
import hashlib
import json
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data/passage-register.json"
WORK_ALIASES = {
    "condorcet-outlines": "condorcet-outlines-historical",
    "kant-anthropology": "kant-anthropology-from",
    "carpenter-mental-physiology": "carpenter-principles-mental",
    "babbage-passages-life": "babbage-passages-from",
    "bernal-world-flesh-devil": "bernal-world-flesh",
    "freud-civilization-discontents": "freud-civilization-its",
    "shelley-frankenstein": "shelley-frankenstein-modern",
    "rilke-dolls": "rilke-dolls-wax",
    "capek-rur": "capek-r-u",
}


def read(path):
    return json.loads((ROOT / path).read_text())


def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def normalized(text):
    # Deliberately retain case, punctuation, spelling, and ellipses.
    return " ".join(text.split())


def reading_text(record):
    return record.get("display") or record.get("translation") or record.get("corrected") or record["original"]


def build():
    works = {w["id"]: w for w in read("data/works.json")["works"]}
    questions = {q["id"] for q in read("data/questions.json")["questions"]}
    sources = ["data/passages.json", "data/works.json", "data/questions.json", "research/keys/pools.json"]
    groups = {}
    aliases = {}

    def add(record, alias, collection, question_ids, pointer):
        work = WORK_ALIASES.get(record["work"], record["work"])
        assert work in works, (alias, work)
        assert set(question_ids) <= questions, alias
        text = normalized(reading_text(record))
        assert text, alias
        identity = hashlib.sha256((work + "\0" + text).encode()).hexdigest()[:24]
        key = "px-" + identity
        assert alias not in aliases, alias
        aliases[alias] = key
        if key not in groups:
            groups[key] = {"id": key, "work": work, "readingText": text,
                           "questions": [], "variants": []}
        group = groups[key]
        assert group["work"] == work and group["readingText"] == text
        group["questions"] = sorted(set(group["questions"] + question_ids))
        group["variants"].append({"alias": alias, "collection": collection,
                                  "location": pointer, "record": record})

    for i, p in enumerate(read("data/passages.json")["passages"]):
        add(p, p["id"], "catalogue", p["questions"], f"data/passages.json#/passages/{i}")
    for i, pool in enumerate(read("research/keys/pools.json")):
        for j, p in enumerate(pool["passages"]):
            add(p, f"pool:{pool['question']}:{p['id']}", "frozen-pilot", [pool["question"]],
                f"research/keys/pools.json#/{i}/passages/{j}")

    records = sorted(groups.values(), key=lambda r: r["id"])
    by_work = defaultdict(list)
    for record in records:
        by_work[record["work"]].append(record)
        # These are work-level source leads, not verified quotation locators.
        record["sourceFiles"] = [
            {"path": "trial/corpus/" + t["file"],
             "exists": (ROOT / "trial/corpus" / t["file"]).is_file(),
             "scope": "work; excerpt location not established by consolidation"}
            for t in works[record["work"]].get("texts", []) if t.get("file")]
        for variant in record["variants"]:
            raw = variant["record"]
            path = raw.get("file") or (raw.get("source") or {}).get("file")
            if path:
                variant["reportedSource"] = path
    overlaps = []
    for group in by_work.values():
        for i, left in enumerate(group):
            for right in group[i + 1:]:
                a = re.findall(r"\w+", left["readingText"].lower())
                b = re.findall(r"\w+", right["readingText"].lower())
                if min(len(a), len(b)) < 30:
                    continue
                matches = sum(m.size for m in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks())
                fraction = matches / min(len(a), len(b))
                if fraction >= .70:
                    overlaps.append({"left": left["id"], "right": right["id"],
                                     "status": "possible overlap; not merged or source-verified",
                                     "sharedFractionOfShorter": round(fraction, 3)})
    return {
        "version": 1,
        "status": "Generated concordance; existing verification labels are preserved, not upgraded.",
        "identityRule": "Same work and identical reading text after whitespace normalization only. IDs identify excerpt forms, not unique historical arguments or verified passages. Editing wording creates a new ID; original record aliases remain resolvable.",
        "rebuild": "python3 scripts/consolidate-passages.py",
        "inputs": {p: digest(p) for p in sources},
        "workAliases": WORK_ALIASES,
        "counts": {"sourceRecords": len(aliases), "excerptForms": len(records),
                   "consolidatedDuplicateRows": len(aliases) - len(records),
                   "possibleOverlapPairs": len(overlaps)},
        "aliases": dict(sorted(aliases.items())),
        "records": records,
        "possibleOverlaps": overlaps,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = build()
    rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != rendered:
            raise SystemExit("Passage register is stale; rebuild it.")
    else:
        OUTPUT.write_text(rendered)
    print(json.dumps(data["counts"]))
