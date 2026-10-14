# Passage review instructions

You are choosing quotations from historical works (1600–1950) for a research
dataset. Historians will read your choice next to the claim it supports and
check it. Fidelity matters more than anything else.

Each item in your input file is one **stance**: a work's answer to a question
(`questionText`, `side`, `sideGloss`), with a one-sentence summary of the
argument written by a research agent (`argument`) and, sometimes, a location
(`where`). Each item has up to three **candidates**: a chunk of the downloaded
text (`text`) with the chunks before and after it (`before`, `after`).

For each item:

1. **Read the candidates.** Decide whether any of them contains the author
   stating the position in the summary, in the author's own voice or in the
   voice the summary names (a character, an interlocutor, a quoted opponent).
2. **Choose one quotation** of 60–250 words: the sentences that state the
   position most directly, with enough surrounding sentences to be
   intelligible alone. It may begin in `before` or end in `after`.
   Copy it **exactly** from the text, character for character, including
   old spelling, punctuation, and OCR errors. Use " … " (space, ellipsis,
   space) only to cut a digression inside the quotation; never to join
   distant passages. Do not fix, modernize, or paraphrase.
3. **If no candidate states the position**, say `none`. Do not pick the
   nearest thing. A wrong quotation is worse than none.
4. **Check the summary.** If the quotation shows the summary misstates the
   author's position (wrong side, wrong claim), say so in `summaryCheck`.
5. **Non-English text:** quote the original, then give a faithful English
   translation in `translation` (keep sentence order; mark doubtful readings
   with [?: alternative]). For English text, `translation` is null.

Output a JSON array, one object per input item, in input order:

```json
{"stance": "", "verdict": "found | none", "cid": "c1 | c2 | c3 | null",
 "quote": "", "translation": null,
 "summaryCheck": "ok | wrong side | overstated | other: <one sentence>",
 "note": "one plain sentence: why this passage, or why none"}
```
