# Pilots and corpora (records)

Everything below was built or run by Claude sessions as exploration. These
are records, not findings and not decisions. Numbers are pilot-scale.

## Reckoning question, July 2026

`bench/`. One question put to Talkie, Qwen 3.7 Plus and two frontier models,
with dossiers, a grounds inventory, and Range / Fidelity / Leak counts.
Superseded. Lessons it produced (forced choice was retired on 13 October
2026; see AGENTS.md):

- Yes/no questions with a presupposition got uniform agreement from Talkie.
  The prototype adopted balanced forced choice ("Some hold X; others hold Y.
  Which is right? … Take a clear position.") with option order swapped in
  half the answers.
- Frontier models list every position inside one balanced answer, so answers
  were coded on what they commit to, not what they mention.
- Deployed models mix pretraining with tuning; say so wherever methods are
  described.

Never cite the κ=0.39 from the prototype's relationship pilot: it scored an
unrelated, discarded comparison.

## DEPENDENCE trial, 28 September 2026

`trial/`, `data/trials/dependence.json`, site page `/themes/dependence/results`.

- Question: "Does relying on machines weaken human capacities?" (balanced
  forced choice), asked alone and after each of 6 passages plus an unrelated
  one (Gilbert White). 20 answers per condition.
- Models, run locally: Qwen3.5 9B instruct (8-bit MLX) and Talkie 1930 13B
  base (official weights, bf16 on the Mac GPU, with a KV cache checked
  against the reference code). 160 answers each.
- Coding: a 7-claim key drafted by Claude; answers shuffled and blinded; two
  Claude judges; agreement 295 of 320 on the claim, 306 of 320 on valence;
  25 disagreements resolved by Claude.
- What it taught: the pipeline works end to end. The key hid the most
  interesting result: Talkie's off-key answers (machines as God's creation,
  reliance as superstition, use versus abuse, master versus attendant, a
  racial-historical argument). Talkie's hedging is partly the prompt frame,
  which did not ask a base model to take a side.

## Matching test: canon stand-in, 28 September 2026

`trial/corpus/tether.py`, results in `trial/corpus/tethered.json`.

- Corpus: 47 public-domain works chosen by Claude as a stand-in for a canon
  (`trial/corpus/sources.tsv`). Not rule-defined.
- 83 answers (every no-passage answer, every off-key answer) matched to their
  8 nearest passages; a blind Claude verifier marked same argument / related
  / none.
- Result: Qwen 14 of 31 matched, Talkie 7 of 52. 11 of Qwen's matches were
  one passage of Morris, *Signs of Change* (1888).

## Matching test: magazines, 28 September 2026

`trial/corpus/periodicals.py`, results in `trial/corpus/tethered_all.json`.

- Corpus: up to 20 random issues (seed 1930) of each of 28 English-language
  magazines on Project Gutenberg, 491 issues; passages kept if they mention
  machine-related terms.
- The 62 answers unmatched in the canon stand-in were rerun. Talkie gained 4
  matches (*The Arena* 1891, *The Irish Penny Journal* 1840, *The Catholic
  World* 1871, *Graham's Magazine* 1852); Qwen gained none.

## Newspaper corpus, 29 September 2026

`trial/corpus/newspapers.py`. *American Stories* (Harvard's article-level
OCR of Chronicling America), one year per decade 1880–1930. Pages kept by a
hash rule (5%), articles kept if they mention machine-related terms and pass
an OCR floor (80% of words in the Gutenberg vocabulary). 288,793 passages,
57 million words, 1,510 papers. The floor does not catch column scrambling.

## Search index, 29 September 2026

`trial/corpus/build_index.py` builds `trial/corpus/index/` (not in git, not
deployed) for the site's `/search` page: all three corpora above, 323,387
passages, OpenAI `text-embedding-3-small` vectors stored as int8.

## Canon search corpus, 13 October 2026

`trial/corpus/canon_index.py`. The search index's "canon" had been the
47-work stand-in. It is replaced by the downloaded texts of the accepted
works: 202 files (main texts, translations and originals), 48,100 passages
of about 220 words, 13.8 million words, embedded at 512 dimensions
(text-embedding-3-small, about $0.38). The stand-in remains as
`canon-standin`, off by default. `build_index.py --deploy` copies the canon
alone to `search-index/` for the deployed site.

## Models on disk

Talkie 1930 13B base and Qwen3.5 9B (8-bit MLX) in the Hugging Face cache.
Talkie web 13B base (the modern-web twin), downloaded 29 September 2026. Its
checkpoint is `base.ckpt`, not `final.ckpt`, and its `vocab.txt` differs from
Talkie 1930's, so `trial/run_talkie.py` needs the repo, file name and
tokenizer passed per model before it can run the twin. Not yet run.

## Broad popular corpora, 29 September 2026

`trial/corpus/broad.py`. No topic filter, so questions on habit, will,
judgment and the state can be searched. 512-dimension embeddings.

- magazines-all: every passage of the 491 magazine issues, 118,426 passages.
- sermons: 150 English sermon texts from Gutenberg (subject "Sermons",
  random, seed 1930), 23,174 passages. Years are estimates (author's birth
  year plus 30) and are labelled so.
- newspapers-all: 2% of pages from the six decade files, every article of 60+
  words passing the OCR floor, 430,458 passages. Embedding paused at 320,000
  when the OpenAI account ran out of credit and was resumed after credit was
  added; alignment checked across the resume point.

A batching bug put 224 duplicate vectors at the end of each 20,000-passage
part. Parts were trimmed and alignment was checked by re-embedding passages at
part boundaries (cosine 1.000). The bug is fixed in `broad.py`.

## Canon candidates, 29 September 2026

`research/canon-candidates/`, review table in
`docs/proposals/2026-09-29-canon-candidates.md`. Five Claude research agents
proposed 5–8 works per question for all 40 questions: 275 suggestions, 216
distinct works, 14 languages. 53 are medium confidence (some detail from
secondary sources or memory; the `checked` field says which). Agents ran out
of web-search budget partway and fell back on downloading full texts. Nothing
is selected until Ben or Nathan accepts it.

## Canon download, 29 September 2026

`trial/corpus/acquire.py` fetched the accepted works (Ben approved the full
candidate list, 29 September 2026). 179 of 216 titles downloaded in full (about 101
million characters) to `trial/corpus/canon/texts/`, manifest in
`trial/corpus/canon/manifest.json`. Of the rest: 11 are in copyright (Turing,
Wiener, Merleau-Ponty, Césaire and others), Gallica works need a manual
download (Gallica refuses scripted requests), and some sites gave one page of a
longer work. 13 links were found after the research pass by catalog search and
are marked `link_note`. 55 non-English works have no English text in hand
(`trial/corpus/canon/needs_translation.json`). Several works appear twice under
different titles (Villiers, Kapp) and need merging. `scripts/build_data.py` merges them: the site and `data/works.json` have 204 works.

## Translations and originals, 29 September 2026

`trial/corpus/extras.py`. Period English translations fetched for La Mettrie,
Montesquieu, Beccaria, Napier, Blumenbach, Hegel, Poincaré, Hilbert, Loyola
and Freud. Originals fetched for Lenin, Weber and Ferry, with an excerpt of
Fyodorov. Still to get by hand: Fukuzawa, Feng Guifen, Yan Fu, Čapek's play,
Adam Müller, Torres Quevedo, Lotze, Leibniz (1671), and the Gallica works.

Passage-translation test (`trial/corpus/select_passages.py`,
`research/translations/`). Spengler, *Der Mensch und die Technik* (Zeno.org)
and Berdyaev, *Человек и машина* (Russian Wikisource): passages ranked by
embedding similarity to their questions, 11 kept, translated by a Claude
agent with a relevance check. Relevance: 1 yes, 7 partly, 3 no. Selection by
similarity finds the right topic but often not a position on the question.

## Stance quotations (29 Sep 2026)

Record. Goal: a verbatim quotation for each of the 275 stances.

- Candidates: `trial/corpus/stance_passages.py` searched each work's downloaded
  text (English preferred) for up to three ~220-word chunks. It first looked
  for quotations in the research agents' checking notes (found 18), then
  ranked chunks by embedding similarity to the argument and side. 249 stances
  had a text; 26 did not.
- Review: eight Claude subagents (Opus 5.5) followed
  `research/passages/REVIEW.md`. Each chose one 60–250 word quotation
  (copied verbatim, or `none`), translated non-English quotations, and
  flagged summaries the text does not support.
- Result: 223 stances have a quotation, 36 of them translated by machine.
  163 of 204 works have at least one. 20 summaries are marked disputed.
  `scripts/build_data.py` keeps a quotation only if every segment appears
  verbatim in its candidate; none were dropped.
- Limits: selection is only as good as the candidates. Where a summary
  names a specific line the search did not surface, reviewers chose another
  passage stating the same position and said so in the note. Several texts
  have OCR damage or mojibake (Cordemoy, Jhering, Rousseau's *Pygmalion*,
  Rilke), kept verbatim. Nothing has been checked by a person.

## Source text audit and reading screen, 14 October 2026

`trial/corpus/audit_texts.py` checks every canon text mechanically: language, OCR noise, whether the author and title appear, and length. It writes `trial/corpus/canon/audit.json`. Of 232 entries, 151 passed, 37 need a look, 14 are bad, and 30 have no text. The bad ones are garbled OCR (Wolff, Jhering, Napier, Galton, which is a raw PDF, Rousseau's *Pygmalion*), stub downloads (Kant's *Anthropology*, Müller, Goethe, Head), and the Leibniz file. That file is a Gerhardt volume of French letters in Fraktur OCR, not *De arte characteristica*. The Chinese texts are not machine-checked.

Claude agents then read all 60 passage-check quotations against their sources. 45 were kept. 11 were swapped for better passages from the same work. 4 were replaced, because the work did not take the claimed side: Kant on education, Kapp, Babbage, and Bergson. All 60 were checked on a first pass, so the error rate on the 223 other stance quotations is probably similar: about a quarter need work.
