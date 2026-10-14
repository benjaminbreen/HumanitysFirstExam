"""Download the texts of the accepted canon.

  python acquire.py            # fetch every work with a link -> canon/texts/, canon/manifest.json
  python acquire.py --retry    # retry only works whose status is not ok

One file per distinct work (author + title), from the link the research agents
gave. Status per work: ok, partial (one page of a longer work, or suspiciously
short), failed, or no-link. The text is kept as downloaded apart from
removing HTML/wiki markup; nothing is corrected.
"""
import hashlib
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = HERE / "canon"
UA = {"User-Agent": "HumanitysFirstExam/0.1 (research; public-domain texts)"}


import ssl
import threading

WIKI_LOCK = threading.Lock()  # Wikisource rate-limits parallel requests


def get(url, timeout=90):
    req = urllib.request.Request(url, headers=UA)
    try:
        r = urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.URLError as e:
        if "CERTIFICATE_VERIFY_FAILED" not in str(e):
            raise
        # Public text on a site with a broken certificate chain.
        r = urllib.request.urlopen(req, timeout=timeout, context=ssl._create_unverified_context())
    with r:
        raw = r.read()
        enc = (r.headers.get_content_charset() or "utf-8").replace("charset=", "")
    try:
        return raw.decode(enc, errors="replace")
    except LookupError:
        return raw.decode("latin-1", errors="replace")


def strip_html(t):
    t = re.sub(r"(?is)<(script|style|nav|header|footer)[^>]*>.*?</\1>", " ", t)
    t = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</h\d>", "\n", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t)
    return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n\s*\n+", "\n\n", t)).strip()


def strip_wiki(t):
    t = re.sub(r"(?s)<ref[^>]*>.*?</ref>", "", t)
    t = re.sub(r"(?s)\{\{[^{}]*\}\}", "", t)
    t = re.sub(r"(?s)\{\{[^{}]*\}\}", "", t)
    t = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", t)
    t = re.sub(r"'{2,}", "", t)
    return strip_html(t)


def gutenberg(url):
    m = re.search(r"/(?:ebooks|epub|files)/(\d+)", url)
    if not m:
        raise ValueError("no Gutenberg id")
    i = m.group(1)
    return get(f"https://www.gutenberg.org/cache/epub/{i}/pg{i}.txt"), "gutenberg-txt"


def archive(url):
    if "/download/" in url and url.endswith(".txt"):
        return get(url), "ia-file"
    m = re.search(r"archive\.org/(?:details|stream|download)/([^/?#]+)", url)
    if not m:
        return strip_html(get(url)), "ia-html"
    ident = m.group(1)
    meta = json.loads(get(f"https://archive.org/metadata/{ident}"))
    files = [f["name"] for f in meta.get("files", [])]
    pick = next((f for f in files if f.endswith("_djvu.txt")), None) or next(
        (f for f in files if f.endswith(".txt") and "meta" not in f), None)
    if not pick:
        raise ValueError("no text file in item")
    return get(f"https://archive.org/download/{ident}/{urllib.parse.quote(pick)}"), "ia-djvu-txt"


def wikisource(url):
    p = urllib.parse.urlparse(url)
    title = urllib.parse.unquote(p.path.split("/wiki/", 1)[1]) if "/wiki/" in p.path else urllib.parse.parse_qs(p.query)["title"][0]
    base = f"{p.scheme}://{p.netloc}/w/index.php"
    api = f"{p.scheme}://{p.netloc}/w/api.php"
    pages = [title]
    q = urllib.parse.urlencode({"action": "query", "list": "allpages", "apprefix": title + "/",
                                "apnamespace": 0, "aplimit": 500, "format": "json"})
    with WIKI_LOCK:
        pages += [x["title"] for x in json.loads(get(f"{api}?{q}"))["query"]["allpages"]]
        time.sleep(1.0)
    parts = []
    with WIKI_LOCK:
        for t in pages[:300]:
            # Rendered HTML includes text transcluded from scanned pages.
            parts.append(strip_html(get(f"{base}?{urllib.parse.urlencode({'title': t, 'action': 'render'})}")))
            time.sleep(1.0)
    return "\n\n".join(parts), f"wikisource ({len(pages)} pages)"


def gallica(url):
    # Gallica serves nothing to scripted requests; these need a manual download.
    raise ValueError("Gallica blocks scripted download; download by hand or find another copy")


def generic(url):
    return strip_html(get(url)), "html-page"


def fetch(url):
    host = urllib.parse.urlparse(url).netloc
    if "gutenberg.org" in host and "projekt-gutenberg" not in host:
        return gutenberg(url)
    if "archive.org" in host:
        return archive(url)
    if "wikisource.org" in host:
        return wikisource(url)
    if "gallica.bnf.fr" in host:
        return gallica(url)
    return generic(url)


def work_key(r):
    return hashlib.sha1(f"{r['author']}|{r['title']}".lower().encode()).hexdigest()[:10]


def main():
    OUT.mkdir(exist_ok=True)
    (OUT / "texts").mkdir(exist_ok=True)
    rows = json.loads((ROOT / "research" / "canon-candidates" / "candidates.json").read_text())
    works = {}
    for r in rows:
        k = work_key(r)
        w = works.setdefault(k, {"id": k, "author": r["author"], "title": r["title"],
                                 "original_title": r.get("original_title", ""), "year": r.get("year"),
                                 "language": r.get("language", ""), "translation": r.get("translation", ""),
                                 "text_url": r.get("text_url", ""), "questions": []})
        w["questions"].append(r["q"])
        if not w["text_url"] and r.get("text_url"):
            w["text_url"] = r["text_url"]
    mpath = OUT / "manifest.json"
    prev = {w["id"]: w for w in json.loads(mpath.read_text())} if mpath.exists() else {}
    retry = "--retry" in sys.argv

    def one(w):
        old = prev.get(w["id"])
        if old and old.get("text_url") and not w["text_url"] or (old and old.get("link_note")):
            # Links added after the research pass (by catalog search) are kept.
            w = {**w, "text_url": old["text_url"], "link_note": old.get("link_note", "")}
        if old and (not retry or old.get("status") == "ok"):
            return {**w, **{k: old[k] for k in ("status", "method", "chars", "file", "error") if k in old}}
        if not w["text_url"]:
            return {**w, "status": "no-link"}
        try:
            text, method = fetch(w["text_url"])
        except Exception as e:
            return {**w, "status": "failed", "error": f"{type(e).__name__}: {str(e)[:120]}"}
        f = OUT / "texts" / f"{w['id']}.txt"
        f.write_text(text)
        status = "ok" if len(text) > 20000 or method.startswith(("gutenberg", "ia-", "gallica", "wikisource")) else "partial"
        if len(text) < 3000:
            status = "partial"
        time.sleep(0.5)
        return {**w, "status": status, "method": method, "chars": len(text), "file": f"canon/texts/{f.name}"}

    with ThreadPoolExecutor(6) as ex:
        out = list(ex.map(one, works.values()))
    mpath.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    from collections import Counter
    print(len(out), "works;", dict(Counter(w["status"] for w in out)))


if __name__ == "__main__":
    main()
