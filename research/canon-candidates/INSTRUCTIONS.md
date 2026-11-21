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

## Screening rules for additions (Ben, 20 November 2026)

Drawn from Ben's verdicts on ten spot-checked suggestions. Apply them to every
passage before it goes to Ben. Judge the full quotation, never a trimmed one.

1. **It answers the question as worded.** Being about the same subject is not
   enough. A sermon that sets railways against "living men" does not say
   whether machinery is evidence of civilization.
2. **It engages the question's key terms.** A passage on borrowing "what is
   good in worldly affairs" fails a question about adopting machinery without
   adopting a way of life: it names neither.
3. **It takes a position.** Memoir, description or impression that touches the
   question without answering it fails (a mill girl recalling that the factory
   bell gave her order).
4. **It gives its own reason.** Mocking or reporting an opponent's view fails.
5. **No analogues.** A doll or a mirror is not an artificial companion.
6. **Fiction counts** when a character states a clear argument on the question.
   Record the speaker.
7. **An offensive premise does not disqualify** a direct argument (Ladd's
   stereotype of Japanese tradesmen). Note it.
8. **Enough text to judge.** If the deciding claim falls outside the
   quotation, extend the quotation or mark the passage "needs more text".
