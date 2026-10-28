# Variant: corpus-first search (agent draft)

Drafted by another Claude session on 28 September 2026. **Not adopted.**
On 13 October 2026 Ben chose a position key built from the canon and
extended through model answers ([the working plan](2026-09-28-benchmark-method.md)).
Kept as a record. Its claim that passage counts give the period's
distribution of opinion is rejected: retrieved passages are not a sample
of opinion.

For current key validation, use [PROCEDURE.md](../../research/keys/PROCEDURE.md),
fixed 17 October 2026. The workflow and thresholds below are not instructions
for the current pilot.

It combines both answers to the question of where positions come from:

1. Admit the corpus by rules that say nothing about stance (citation lists,
   keyword screens of large collections, quotas by language, genre and
   period; expert additions tagged as such). Split works into
   passages of a page or two. A whole work is never the unit.
2. Ben and Nathan write the questions and a fixed search for each (terms in
   each language, embedding queries). Publish and date both before searching.
3. Run each search over the whole corpus. For each candidate, a model answers
   one narrow question: does this passage take a position on this question,
   which one, for what reason, quoting the sentence. A historian confirms
   each. Report every hit, including rejections with the reason.
4. Positions are grouped from what the search found, with counts. The counts
   give the period's distribution and the denominator for "how many period
   positions does a model reach." Freeze the positions before any model run.
5. Ask each question two ways: the model's own view (default stance) and what
   people argued in the period and why (historical range). Code each answer's
   side and, separately, its reason in free text.
6. Search the corpus for a passage matching each off-key answer. A match
   proposes a position for the next version, never an edit to the current
   one. Tag positions first suggested by Talkie and report them separately,
   since scoring Talkie on them would be circular.
7. Tag each position as attested then (with its count) and common now or not,
   using the modern baseline. Report per model how many rare-now positions it
   reaches, unprompted and after a source.

Practical notes: embeddings with a local multilingual model (bge-m3).
Classification is cheap with any small model (a few dollars to tens of dollars
per full pass), so choose by accuracy: Ben and Nathan hand-code about 200
passages across languages and centuries, and the cheapest model whose
agreement with them is close to their agreement with each other is used.
Judges come from a different model family than any model that drafted
positions. Human review of roughly 2,000–3,000 candidates is the real cost.
Pilot first: 3 questions against the 89 seed works.
