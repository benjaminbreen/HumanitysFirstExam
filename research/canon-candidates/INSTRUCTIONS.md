# Instructions: candidate works for the question bank

You are helping two historians (Benjamin Breen, UCSC; Nathan Davies) choose
primary sources for a dataset of historical arguments about machines and human
autonomy, 1600–1950. Your output is a list of **suggestions** they will accept
or reject. Accuracy matters more than volume.

For each question assigned to you, propose **5–8 works** that argue it.

Requirements:

1. **Real, verified works only.** Confirm each work exists (author, title, date)
   with a web search or fetch of a catalogue, Wikidata, Project Gutenberg,
   Internet Archive, HathiTrust or Wikisource. If you cannot confirm it, leave
   it out. Never guess a title, date, chapter, or page.
2. **Both sides.** Include works on opposing sides of the question, and say
   which argument each makes.
3. **Beyond the Anglo canon.** Where you can, include non-English works (French,
   German, Russian, Chinese, Japanese, Indian, Arabic, Latin American) and
   non-canonical sources (popular science, sermons, periodical essays, fiction,
   manuals). For non-English works, say whether a public-domain English
   translation exists and give it.
4. **Period.** Published 1600–1950. An earlier work is allowed only if it was
   widely read in the period; mark it `earlier: true`.
5. **Where in the work.** Give a chapter, section, letter or essay title only if
   you confirmed it. Otherwise leave `where` empty. No page numbers unless you
   saw them.
6. **Text link.** Give a direct link to a public-domain full text (Gutenberg,
   Internet Archive, Wikisource, HathiTrust full view, Gallica) only if you
   opened it or its catalogue page. Otherwise leave it empty.

Output a JSON array, one object per candidate:

```json
{"q": "Q01", "author": "", "title": "", "original_title": "", "year": 0,
 "language": "", "earlier": false,
 "argument": "one sentence: the position it takes and its reason",
 "side": "short label for which answer it supports",
 "where": "", "text_url": "", "translation": "",
 "wikidata": "", "kind": "treatise | essay | fiction | periodical | sermon | letter | manual | other",
 "confidence": "high | medium", "checked": "what you verified and where"}
```

Plain language in `argument`: what the work says, not how important it is.
