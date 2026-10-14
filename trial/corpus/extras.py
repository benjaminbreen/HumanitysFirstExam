"""Add period English translations (group A) and missing originals (group C)
to the canon manifest, then fetch them with acquire.fetch.

  python extras.py

Each added record carries `role` ("translation" or "original"), the id of the
work it belongs to (`of`), and how the source was found. Translations are
period translations, not machine translations.
"""
import json
from pathlib import Path

from acquire import OUT, fetch

HERE = Path(__file__).parent

# (role, match on author, match on title, url, note)
ADD = [
    ("translation", "La Mettrie", "Man a Machine", "https://www.gutenberg.org/ebooks/52090", "Gutenberg #52090 (Open Court, 1912)"),
    ("translation", "Montesquieu", "Spirit of the Laws", "https://archive.org/details/spiritoflaws01nugguoft", "Nugent translation, vol. 1"),
    ("translation", "Beccaria", "On Crimes and Punishments", "https://archive.org/details/essayoncrimespun1775becc", "English translation, 1775"),
    ("translation", "Napier", "Mirifici", "https://archive.org/details/bim_early-english-books-1475-1640_a-description-of-the-adm_napier-john_1616", "Edward Wright, 1616"),
    ("translation", "Blumenbach", "Generation", "https://archive.org/details/b2144058x", "A. Crichton, 1792"),
    ("translation", "Hegel", "Philosophy of Right", "https://archive.org/details/cu31924014578979", "S. W. Dyde, 1896"),
    ("translation", "Poincar", "Science and Method", "https://www.gutenberg.org/ebooks/39713", "Halsted, The Foundations of Science (1913), includes Science and Method"),
    ("translation", "Hilbert", "Mathematical Problems", "https://www.gutenberg.org/cache/epub/71655/pg71655-images.html", "Newson translation, 1902 (Gutenberg #71655)"),
    ("translation", "Loyola", "Obedience", "https://archive.org/details/LettersAndInstructionsOfStIgnatius", "Letters and Instructions (1914)"),
    ("translation", "Freud", "Civilization and Its Discontents", "https://www.gutenberg.org/ebooks/78221", "Joan Riviere, 1930 (Gutenberg #78221)"),
    # Group C: public-domain originals not yet in hand.
    ("original", "Lenin", "State and Revolution", "https://ru.wikisource.org/wiki/Государство_и_революция_(Ленин)", "Russian Wikisource"),
    ("original", "Weber", "Politics as a Vocation", "https://de.wikisource.org/wiki/Politik_als_Beruf", "German Wikisource"),
    ("original", "Fedorov", "Common Task", "https://ru.wikisource.org/wiki/Философия_общего_дела_(Федоров)", "Russian Wikisource"),
    ("original", "Ferry", "Speech", "https://www2.assemblee-nationale.fr/decouvrir-l-assemblee/histoire/grands-discours-parlementaires/jules-ferry-28-juillet-1885", "Assemblée nationale, grands discours"),
]


def main():
    mpath = OUT / "manifest.json"
    m = json.loads(mpath.read_text())
    have = {w["id"] for w in m}
    for role, author, title, url, note in ADD:
        base = next((w for w in m if author.lower() in w["author"].lower() and title.lower() in w["title"].lower()
                     and not w.get("role")), None)
        if not base:
            print("no base work for", author, title)
            continue
        rid = f"{base['id']}-{'en' if role == 'translation' else 'orig'}"
        if rid in have and next(w for w in m if w["id"] == rid)["status"] == "ok":
            continue
        rec = {"id": rid, "role": role, "of": base["id"], "author": base["author"], "title": base["title"],
               "text_url": url, "link_note": note, "questions": base["questions"]}
        try:
            text, method = fetch(url)
            f = OUT / "texts" / f"{rid}.txt"
            f.write_text(text)
            rec.update(status="ok" if len(text) > 3000 else "partial", method=method, chars=len(text),
                       file=f"canon/texts/{f.name}")
        except Exception as e:
            rec.update(status="failed", error=f"{type(e).__name__}: {str(e)[:120]}")
        m = [w for w in m if w["id"] != rid] + [rec]
        print(f"{rec['status']:8} {role:11} {base['author'][:24]:24} {rec.get('chars', 0):>9} {rec.get('error', '')}")
    mpath.write_text(json.dumps(m, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
