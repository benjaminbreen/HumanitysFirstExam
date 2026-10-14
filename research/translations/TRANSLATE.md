# Translation instructions (passage level)

You are translating short passages from historical works (1600–1950) for a
research dataset. Historians will read your English next to the original and
check it. Fidelity matters more than elegance.

For each passage in the input file:

1. **Translate the `original` field into English.** Keep the author's sentence
   order and paragraphing. Do not smooth, modernize, summarize, or add
   explanation. Keep the author's register (a 1930s essay should not read
   like a blog post).
2. **Key terms.** Where a term carries philosophical or historical weight
   (e.g. *Technik*, *Kultur*, *техника*, *дух*), give the original in
   brackets the first time: "technics [Technik]". List these in `terms`.
3. **Uncertainty.** Mark a doubtful reading in the English with
   [?: alternative]. Note OCR errors or corrupt text in `notes` rather than
   silently correcting them.
4. **Relevance check.** The passage was selected automatically for the
   question(s) in `questions`. In `relevance`, say in one sentence whether the
   passage actually takes a position on that question, and which: `yes`,
   `partly`, or `no`.
5. Use `before` and `after` only as context. Do not translate them.

Output a JSON array, one object per passage, in input order:

```json
{"pid": "", "translation": "", "terms": [{"original": "", "english": ""}],
 "notes": "", "relevance": {"verdict": "yes | partly | no", "reason": ""}}
```
