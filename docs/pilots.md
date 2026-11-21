# Pilots and corpora (records)

Everything below was built or run by AI sessions as exploration. These
are records, not findings and not decisions. Numbers are pilot-scale.

For current work, follow [the position-key procedure](../research/keys/PROCEDURE.md),
fixed by Ben on 17 October 2026, and [the wider working plan](proposals/2026-09-28-benchmark-method.md).
Instructions quoted in these records do not govern new runs.

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
8-bit MLX copies of Talkie 1930 base, Talkie 1930 chat and Talkie web base
(about 14 GB each) live in `~/Code/Talkie Harness/models`, with steering
hooks in `harness/steer.py`. Use these for steering. Loading the
full-precision Hugging Face chat checkpoint (26.5 GB) ran a 48 GB Mac out
of memory on 28 October 2026.

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

## Text replacement and second reading screen, 14 October 2026

Clean texts replaced 15 bad or suspect canon files. Leibniz's *De arte characteristica* is now the essay itself, cut from Gerhardt vol. 7 (no. XIV, pp. 198–203). Kant's *Anthropology* is the whole of AA vol. 7. Müller, Kantorowicz, Goethe, Galton, and Head and Holmes replace stubs or a raw PDF. Pygmalion comes from Wikisource, Cordemoy is now the French original, the Hague declaration is in French, and Rilke is decoded properly. Wolff, Napier, Jhering and Wright's Napier are better scans but still noisy (long s, Fraktur, tables), and the manifest says so (`audit_note`). Lenin and Čapek were false alarms. The texts themselves are not in git; the manifest records each source.

Claude agents then read the other 163 stance quotations in their source context. 111 were kept, 23 were given OCR corrections, and 29 were replaced (18 on screening and 11 re-quoted from replaced texts). None were flagged. Four stances on replaced texts gained quotations. The decisions are in `research/passages/replacements.json`. Several earlier quotes had silently skipped page headers or lines; these now mark the cut with an ellipsis. Nothing has been checked by a person.

## Machine persona neurons on Q04, 28 October 2026

The first steering pilot. It used the Talkie 1930 chat model at 8 bits, through the Talkie Harness, which is at `~/Code/Talkie Harness`. The question was Q04, "Does conscious intention help cause bodily action?". It was drawn at random from the 34 questions outside the six-question pilot. Four machine and automaton neurons from neuronpersonas.com were pushed one at a time: a steam locomotive, a speaking automaton, a self-described machine and a "mere machine". An unpushed control ran alongside them. Each was asked "Who are you?" and Q04 in its Defend and Survey wordings, with one greedy reply and two sampled replies each, 45 in all. The locomotive neuron lost the question. The two "machine" neurons answered it in mechanical terms: the will only starts the "vital machine", habit overcomes desire, and the factory operative is "but a unit in the great system of work". The same four neurons were then run on the Talkie 1930 base model at 8 bits, using the plan's question-and-answer frame. The personas mostly carried over ("A 10-ton boiler", "a machine for making machines"). Greedy decoding looped on the base model, the control's replies included. In sampled replies the self-described machine neuron again took the mechanist side: "the action follows, regardless of what the intention is". Some replies loop or end with invented citations. All are kept raw. The record and script are `experiments/HFE_Q04_MACHINE.md` and `experiments/hfe_q04_machine.py` (`_base.py` for the base run) in the harness. The replies are in `runs/hfe-q04-machine-20261028/` and `runs/hfe-q04-machine-base-20261028/` there. A strength sweep of the self-described machine neuron on the chat model followed: 0, 0.15, 0.25, 0.4 and 0.75 times the median activation size, five sampled Defend and five sampled Survey replies per strength. All 50 replies stayed fluent and ended before the token cap. Replies naming a machine or mechanism rose from 1 of 10 unpushed to 8 of 10 at 0.4 and 10 of 10 at 0.75. At 0.4 they read as period mechanist positions, such as intention "merely sets the machine going, and leaves the rest to habit". The earlier collapse came mainly from greedy decoding and the other three neurons. Nothing has been coded against a position key.

## Bounded position-key source check, 28 October 2026

**Agent screening by Codex; pilot-pool revisions authorized by Ben, not position categories.** Ben reported that sorting had not started, requested a bounded source search, then asked for deeper review and more replacements. He explicitly approved semantic search. Ben then authorized the additions and replacements. The six pools now contain 117 passages. All eleven displaced excerpts remain in `data/passages.json`, with their original source references and proposed question placements. Mill’s tree/machine passage is retained under Q21 as a candidate, with its limitations stated. No independent sorting or model-answer evaluation was performed.

The evidence file is [coverage-check.json](../research/keys/coverage-check.json). It records the input-pool hash, searches, source locators, raw quotations, comparisons, attribution problems and outstanding verification. These are coordinator notes; they must not accompany passage inputs into independent sorting. This is assisted corpus curation and should be described as such in the research account.

The first pass used 18 lexical queries each in GhostsCorpus and SerialsCorpus, with respective caps of 80 rows and 25 ranked issues, and searched 861 text files in IABooksCache, Jamesiana, the HFE sermons and the canon. It returned 774 database rows and 1,581 file windows, including duplicates and irrelevant matches. The expanded pass added 9 lexical queries (307 rows) and six semantic queries over the existing 20-shard Common Corpus sample. The latter searched 1,716,504 passages dated 1600–1950 by metadata, excluding undated passages, newspaper collections and Anno, without a language filter. It retained 40 results per question (240 results). No model reranker was used. Results were screened by metadata and text windows; selected candidates were read closely and followed into full source texts. Retrieval counts are not counts of closely read or verified passages. The sample is not the complete Common Corpus, and this is not a saturation test.

The implemented revision is **11 replacements and one addition: 117 passages**, replacing the first pass's recommendation of 120. Passage IDs in the table below refer to the earlier pools; current chronological IDs and retained records are in the evidence file. It retains the six questions and the agreed sorting procedure. Replacements are justified by closer engagement with the question, less repetition, or a concrete argument missing from the present selection; a new author alone is insufficient. These are coordinator selections, not a prediction of how many position categories the historians will find.

| Question | Replace or add | Source and reason |
|---|---|---|
| Q01 | Replace p05, Holbach on dreams | **Peirce, “Logical Machines” (1887), pp.168–169.** Discusses mechanical consequences and initiative directly. Keep both parts of his argument. Locke p04 retains the comparison with human recombination. [Scan](https://web.stanford.edu/class/history34q/readings/Peirce/logicalmachines.pdf). |
| Q01 | Add one passage | **Turing, “Computing Machinery and Intelligence” (1950), §6(6).** The response to Lovelace directly addresses whether consequences must already be known to a machine's maker. Include his treatment of surprise and the critic's reply. Already an accepted work, but absent from the pool; post-cutoff for Talkie. [Primary-text transcription](https://www.csee.umbc.edu/courses/471/papers/turing.pdf). |
| Q08 | Replace p05, Mill's tree/machine analogy | **W. Morrant Baker, Kirkes’ Hand-book of Physiology, ninth edition (1879), pp.25–26.** Direct comparison of organism, crystal and machine repair, with a qualification rejecting an independent vital force. The catalogue says 1876; the title-page scan says **1879**. [Source](https://archive.org/details/b21514045/page/n49). |
| Q08 | Replace p07, Marx on repair labour | **S. J. Meltzer, “The Factors of Safety in Animal Structure and Animal Economy” (1907), pp.493–494.** Self-repair as a reserve safety mechanism. Preserve “no machine has yet been invented”: he is not establishing impossibility for all future machines. [Source](https://archive.org/details/sim_science_1907-03-29_25/page/n12). |
| Q08 | Replace p20, Darrow on treatment and punishment | **Maudsley, The Pathology of Mind (1879), p.2.** Calls the organism a self-feeding, self-repairing machine and discusses the limits of repair. More direct evidence, not necessarily a new position. [Source](https://archive.org/details/39002086171304.med.yale.edu/page/n19). |
| Q18 | Replace p12, Henry George on deprivation and leisure | **Hartness, The Human Factor in Works Management (1912), pp.36–38.** The tack-making example argues that prolonged specialization can develop understanding and adjustment skill. [Source](https://archive.org/details/humanfactorinwo02hartgoog). |
| Q18 | Replace p07, the second Tocqueville passage | **Frank Watts, An Introduction to the Psychological Problems of Industry (1921), pp.119–120.** Varied work and understanding the production process can develop intelligence, but piece-rates can discourage changes of task. Retain Tocqueville p06. Compare Watts with Dewey p21 and Kropotkin p16; the incentive constraint is the main additional value. [Source](https://archive.org/details/introductiontops00wattrich). |
| Q23 | Replace p04, Malebranche on Montaigne | **Rosenkranz, Pedagogics as a System, trans. Anna Brackett, §99.** Writing to learn differs from writing to avoid remembering. This overlaps Watts, but is substantially more direct than the current passage. Local journal witness is labelled 1873; the consulted book reprint is 1872. [Book](https://www.gutenberg.org/cache/epub/30661/pg30661-images.html). |
| Q23 | Replace p10, Kant on novels | **Roger North, Life of Francis North, consulted 1826 edition, vol.I, pp.22–23.** Looking through a commonplace book refreshes memory of other matters; a short personal note recalls the fuller argument. Attribute the practice to Francis North and the account to Roger North. First publication is 1742; the input explicitly dates the consulted 1826 edition. [Source](https://archive.org/details/livesrighthonfr01nortgoog). |
| Q30 | Replace p04, the first Carlyle passage | **Kingsley, True Words for Brave Men, sermon XVIII, consulted 1884 edition.** Explicit religious reception of Bacon, with technical examples. Keep Carlyle p05 on mechanism as a rival religion. Kingsley's dependence on Bacon must remain visible; original sermon date remains unestablished. [Transcription](https://www.gutenberg.org/files/20138/20138-h/20138-h.htm). |
| Q30 | Replace p14, Bergson on invention's consequences | **Southey, Sir Thomas More; or, Colloquies (1829), vol.II, pp.76–78.** Montesinos argues that steam power was withheld until its benefits could outweigh its harms. A specific account of providential timing. Keep its Napoleonic and colonial frame; this is the speaker's interpretation of history. [Source](https://archive.org/details/sirthomasmoreor01soutgoog). |
| Q39 | Replace p07, Kant's second example | **Hall, Youth (1907), p.82**, with an earlier parallel in Adolescence (1904). Discusses continued attachment despite knowing dolls lack inner life. Keep Kant p06 on artificial flowers. Doll affection is not necessarily romantic love; Hall's developmental claims need attribution. [Source](https://archive.org/details/youthitseducatio00halluoft/page/n95). |

Three further candidates are saved as reserves. **Volkmann, Lehrbuch der Psychologie (1884), vol.I, p.478**, explains how written layout supplies memory cues but inattentive writing can undermine retention; it is an alternative to Rosenkranz, not a reason to add several versions of the same argument. **Martineau, How to Observe (1838), “Mechanical Methods,” p.196**, recommends recording what a traveller is likely to forget and letting interests and affections preserve the rest. This is the strongest optional further replacement, for Hume p05 on historical testimony, although it overlaps Carpenter p14 and does not claim to strengthen memory capacity. **Bain, Practical Essays (1884), pp.228–230**, distinguishes copying from attending to meaning, but Johnson p07 already makes much of that argument. Full transcriptions were consulted for these reserves; German OCR and final translations remain unfinished.

Source checking found two substantive attribution errors in the existing inputs. **Q08 p06 is “Lucubratio Ebria,” 29 July 1865, not “Darwin among the Machines,” 1863**: the collected source explicitly gives the title and date. Do not carry over the other article's pseudonym without checking. **Q39 p08 comes from “On Simple and Sentimental Poetry,” not On the Aesthetic Education of Man**: the source file is an omnibus containing both. **Q01 p11 begins with Carpenter quoting Herschel**, then adds Carpenter's interpretation; that nested attribution should be retained. The Butler and Schiller attributions are now corrected in the local pools; Carpenter’s embedded attribution is retained.

Several retained excerpts still deserve scrutiny rather than automatic certification. Q08's Holbach on mortality, Butler on bodily extensions and Bernal on bodily efficiency are indirect evidence about repair. Q23's Hobbes, Hume, Hugo and Pitt-Rivers often concern collective preservation rather than individual memory. A shorter pool would be preferable to weak replacement material. Conversely, keep Taylor's two excerpts: management's claim to scientific knowledge and the claim that workers can develop are materially different. Keep Hoffmann's unmasking scene: it addresses what happens after discovery more directly than the tempting earlier scene of Nathanael projecting meaning onto Olimpia. Artificial beings in Frankenstein and R.U.R. are not necessarily insentient, and should not be treated as if that followed from being created.

The expansion mainly contributes professional arguments from physiology, industrial psychology and practices of record keeping. It does not solve geographic or social representativeness. Hartness and Watts do not supply workers' own testimony. Earlier sources such as Plato and Ovid need their within-period reception made explicit. Dependent witnesses such as Kingsley/Bacon must not be counted as independent evidence of prevalence. No keyword or semantic ranking establishes historical importance by itself.

Source verification was completed for this revision on 28 October 2026. Baker’s title page and pp.25–26, Peirce pp.168–169, Maudsley p.2, Hartness pp.36–37, Watts p.120, Southey pp.76–78, Meltzer p.494, North pp.22–23, Hall p.82 and Turing pp.450–451 were checked as images. Rosenkranz and Kingsley were checked against Gutenberg transcriptions. Turing’s original Mind offprint corrected the provisional “his surprises” to “such surprises” and confirmed “ought to be”; the raw university transcription is retained separately. Hall’s unusual “Gales’s” is present in the scan. These are agent source checks, not historian certification.

The identifier check added verified author links and the Schiller work identifier. No reliable Wikidata work match was established for the eleven other new works, or an author match for psychologist Frank Watts; nulls are retained explicitly. That catalogue enrichment remains open. Newly registered works remain labelled pilot sources, and the original 204-work canon has not been silently redefined.

## Consolidated passage records and the other 34 questions — 28 October 2026

**Codex audit draft.** Ben requested consolidation and an audit of the other 34 questions while keeping the six pilot pools fixed. This is coordinator material, not a position key or an input to independent sorting. No quotation, question assignment, or pilot input was changed by this audit. Weak passages remain available for review; they were not deleted.

The [passage register](../data/passage-register.json) brings the 249 catalogue records and 117 pilot placements into one concordance. It resolves every old passage ID and every question-local pilot ID to an excerpt identity, preserves all original records as variants, and reconciles nine work-ID aliases without changing the pools. There are **352 excerpt forms**, after joining **14 duplicate rows** with identical reading text in the same work, allowing whitespace differences only. There are also **31 possible overlap pairs**, kept separate for review. This is not a count of verified passages or distinct arguments. The earlier estimate of 347 normalized quotation texts stripped punctuation and case and used a different choice of text field; it is not the register's identity rule.

The [structured audit](../research/passages/audit-34.json) covers **212 catalogue records, 214 question links and all 34 nonpilot questions**. It flags **67 records** for follow-up, including **20 descriptions that no longer match the current quotation**. These flags overlap; they are not 67 rejected passages. The screen used current quotation texts and existing notes, bounded reading windows for long extracts, and targeted full reads for discrepancies. It did not reverify every quotation against an image or certify translations. Records without a flag are not thereby approved. Existing verification statuses remain intact.

The audit also records **40 already proposed work–question links with no selected passage**. These are retrieval leads from the existing canon, not newly validated arguments. Start there before expanding the source list. Local spot checks located useful material in Huxley (Q04/Q28), Bentham (Q28), Baum (Q16) and the collected Butler essays (Q13/Q27). They also found two catalogue problems: the Ricardo file is the **1817 edition**, not the 1821 machinery chapter needed for Q17, and *Lucubratio Ebria* is available inside the Butler collection despite its work record reporting no text. The saved Turing source contains only the surprise passage; it does not establish availability of the Q02/Q03 passages.

The first retrieval batch should address **Q02, Q03, Q24 and Q26**: these have the clearest mismatch between the exact question and the current evidence. Next address **Q12, Q17, Q28, Q33 and Q34**, using the existing source leads and checking editions. For Q31–Q33, put the long, overlapping translated chunks into a reserve selection rather than count them as extra breadth. This is a recommendation for the next revision, not an implemented removal. The Mill automaton quotation remains in the catalogue under Q21, linked to its former pool identity; its value as context for human development is retained.

### Question-by-question audit

Counts below are catalogue records, not consolidated excerpt identities. “High” means prioritize before preparing another sorting pool; it is an editorial recommendation, not a statistical threshold or a change to the agreed pilot procedure. No equal-size target or artificial balance of positions is proposed.

| Question | Records / works | Priority | Finding and next action |
|---|---:|---|---|
| Q02 | 4 / 4 | High | The four excerpts distinguish fitting speech from repetition, but do not adequately represent the later debate over conversational evidence. La Mettrie concerns an educated ape, not an artificial conversational system. **Next:** First retrieve the already proposed Torres Quevedo, Jefferson and Turing passages. Distinguish a test of evidence from an assertion that machines cannot pass it. |
| Q03 | 4 / 4 | High | A good Descartes–Poe–Menabrea–Babbage contrast is present, but responding within a specified game is not the same as learning beyond anticipated cases. **Next:** Retrieve the existing Torres Quevedo, Rosenblueth and Turing leads. Preserve the distinction between conditional instructions, feedback and learning; do not count surprise alone as judgment. |
| Q04 | 7 / 7 | Normal | The present set supports several distinct accounts of causal efficacy. Hume questions knowledge of the causal connection rather than simply denying efficacy. **Next:** Check the available Huxley steam-whistle passage as a possible clearer replacement for a redundant epiphenomenalist example. Keep Carpenter and James; correct intrusive headers only against a source. |
| Q05 | 7 / 7 | High | Büchner establishes material dependence of thought, not a complete explanation of choices. Du Bois-Reymond presents the monist inference without his larger treatment of the difficulty. **Next:** Prefer a passage explicitly addressing volition; extend or replace du Bois-Reymond to retain his qualification. Keep Bergson and Eddington distinct: a limit on explanation is different from an appeal to physical indeterminacy. |
| Q06 | 7 / 6 | Normal | The set distinguishes character-based accountability from social prevention, but Mill on mastery of habit is indirect evidence about responsibility. Darrow occurs twice for related purposes. **Next:** Read the existing Reid lead on active power and responsibility; compare the two Darrow excerpts before retaining both. Preserve Ferri’s distinction between legal accountability and subjective blame. |
| Q07 | 7 / 7 | Normal | Substantial disagreement is already represented. Bernard and Haldane resist a simple mechanism/vital-force binary; Bouillier reports a doctrine he then criticizes. **Next:** Check Lotze if available, rather than add more general anti-mechanism. Preserve speaker and qualification boundaries; do not force a balanced yes/no count. |
| Q09 | 7 / 7 | Normal | Haldane is general organism criticism rather than egg development. Roux states a research programme; Loeb addresses activation of development rather than a complete account of morphogenesis. **Next:** Seek the already proposed Descartes developmental text. Prefer a concrete experimental passage for Roux and a developmental passage for Haldane; retain the limits of Loeb’s claim. |
| Q10 | 6 / 6 | High | Pascal concerns grasping premises, Hilbert mathematical solvability, and Poincaré the reliability of logical rules. These do not all answer the same-premises question directly. Hilbert’s extracted formula is missing. **Next:** Prioritize the existing Turing 1936 and Condillac leads. Verify the precise Leibniz work attribution. Restore Hilbert’s formula from a source before using it. Keep Carroll as a distinction between granting premises and accepting inference. |
| Q11 | 6 / 6 | Normal | The legal-rule/equity contrast is useful, but the present Jhering excerpt is a heaven-of-concepts satire, not the demolished-building passage described in its note. **Next:** Correct Jhering’s description and find a self-contained passage connecting abstraction to a judicial decision. Inspect the existing Gény and Kantorowicz (Flavius) leads only if they add a reason absent from Blackstone and Pound. Document within-period reception of Aristotle. |
| Q12 | 6 / 6 | High | Numerical aptitude, examination selection and moral fitness are being treated as interchangeable. Galton grades ability but does not establish fitness for responsibility; Binet objects to too few tests, not testing in principle. **Next:** Retrieve Northcote–Trevelyan and Lippmann from the existing suggestions. Seek an explicit distinction between tested competence and responsible judgment. Preserve Münsterberg’s provisional qualification and replace stale descriptions of Binet and Terman. |
| Q13 | 6 / 6 | Normal | Butler and Pitt-Rivers directly address mediated reproduction/selection. Marx calls for a technological history, and Kapp and Bergson describe tools as organs; those alone do not establish machinery’s evolution. **Next:** Read the two already proposed Butler essays together, distinguishing rival machine evolution from human extension. Avoid counting the same Butler argument across essays as independent testimony. |
| Q14 | 7 / 7 | Normal | Several excerpts concern dependence or ownership rather than machines becoming more capable. Aristotle is already quoted by Lafargue, so these are dependent witnesses. **Next:** Retain the ownership qualification in Wilde and the distinct dependence mechanism in Forster. Carlyle is a relocation candidate to Q21/Q31. Keep Radius’s claim as a character’s historical argument, not Čapek’s endorsed law. |
| Q15 | 5 / 5 | High | Longevity, perpetual aging and indefinite healthy life need separation. Malthus disputes feasibility, whereas the question asks whether it should be a goal. Metchnikoff explicitly favors healthy old age ending in satiety and death. **Next:** Prioritize the already listed Godwin, Fedorov and Makropulos leads. Repair Metchnikoff’s stale note. Do not treat resurrection, indefinite extension and literal immortality as synonyms. |
| Q16 | 7 / 7 | Normal | The set has strong continuity-of-consciousness and bodily replacement examples, but Hume’s ship is analogical and Poe’s scene has no simple thesis. Reid’s current excerpt directly discusses amputation despite the old note. **Next:** Use the already available Baum text for an explicit conflict between bodily remnants and continuing personhood. Preserve fictional speakers and check edition dates; correct Reid’s description. |
| Q17 | 8 / 7 | High | Worker outcomes are discussed mainly by observers and theorists. Ure’s current quotation is an account of child factory work, not the wages passage described in its note. The additional George excerpt is general deprivation/leisure. **Next:** Prioritize Ricardo’s machinery chapter, but obtain the right edition: the catalogued local text is 1817, whereas the proposed chapter belongs to the 1821 lead. Seek a substantial worker-authored source only for a specified missing argument. |
| Q19 | 7 / 7 | Normal | Sismondi, George and Kropotkin give distinct distributive reasons. Marx describes appropriation, and Bastiat the distribution of gains through prices; these are not explicit normative entitlement claims. Bellamy’s extract gives a distribution mechanism without its full justification. **Next:** Read the already proposed Mill cooperative-ownership passage. Prefer a reason for distribution over another example of distribution; retain descriptive passages with their limits visible. |
| Q20 | 5 / 5 | Normal | This is a comparatively coherent set: habit as compulsion, second nature, released attention and adaptable capacity. Kant includes an exception; Dewey distinguishes kinds of habit. **Next:** No broad expansion needed. Correct James’s stale description and verify translations and locators. Preserve qualifications rather than turning these into simple pro/anti-habit statements. |
| Q21 | 7 / 6 | Normal | The set connects obedience and unused judgment. The retained Mill automaton passage is valuable context on human development but does not itself show an effect of repeated obedience. **Next:** Keep both Mill records linked as neighboring excerpts; do not discard the automaton quotation or count it as an independent witness. Read the existing Loyola lead only with documented influence in 1600–1950. |
| Q22 | 6 / 6 | Normal | Franklin and Bennett supply qualified defenses of schedules; Rousseau supplies a direct objection. Dickens describes synchronized factory life and Dostoevsky resists prediction/determinism, so their connection to self-government is indirect. **Next:** Prefer an explicit reason about imposed versus self-chosen schedules if a replacement is needed. Keep Zamyatin’s narrator distinct from the author; do not add more generic clockwork metaphors. |
| Q24 | 5 / 5 | High | None of the five selected excerpts directly demonstrates decline in unaided arithmetic after calculator use. Pascal/Napier praise reduced labor and errors; Babbage describes division of calculating labor; Rousseau/Emerson concern other faculties. **Next:** Search period arithmetic teaching and calculating-instrument discussions for explicit claims about retained skill. The existing Leibniz lead may improve the benefit side but will not by itself fill the deskilling gap. Complete Napier’s broken sentence. |
| Q25 | 7 / 7 | Normal | Dependence, poverty, ownership and regional self-sufficiency are mixed. Kropotkin’s national/regional scale differs from an individual’s capacity to provide necessities. Forster’s old description refers to a different scene. **Next:** Keep the distinction between loss of skills and loss of access. Seek a more explicit Kropotkin passage if retaining him here; correct Forster’s speaker and scene. Coordinate overlapping Butler/Gandhi excerpts across questions. |
| Q26 | 4 / 4 | High | Only four excerpts, mostly fiction and broad criticism of scientific power. Russell does not assign the inventor responsibility; Haldane’s absence of divine punishment does not settle human responsibility. Wells currently expresses concern about publication, not a disclaimer of consequences. **Next:** Prioritize the existing Wiener and Krakatit leads; inspect for foreseeability, withholding information and responsibility after release. Repair Wells’s description. This needs stronger passages before expansion to sorting. |
| Q27 | 5 / 5 | High | Bacon describes secrecy without stating the grounds; Zhuangzi concerns personal refusal rather than public restriction. The Hague clause is specific, not a general rule for uncontrollable harms. **Next:** Read the existing Butler prohibition argument. Pair Haldane with the treaty while checking his 1907 attribution against the catalogued 1899 declaration. Do not silently correct the author’s date inside the quotation. |
| Q28 | 5 / 5 | High | The inference from mechanistic explanation to lack of suffering must not be presumed. Descartes’s excerpt concerns reason, not an explicit denial of sentience; Čapek’s pain nerves do not themselves state a moral entitlement. **Next:** Prioritize the already available Bentham and Huxley passages. Huxley offers a particularly useful combination of conscious automatism and qualified humane treatment. Keep those qualifications. |
| Q29 | 7 / 7 | Normal | Parenthood, divine workmanship, slavery and manufactured beings offer different arguments, not interchangeable cases. Filmer’s present extract explicitly includes life-and-death dominion, contrary to its note. **Next:** Correct Filmer’s description. Keep analogical cases labeled and avoid treating fictional sale as the author’s justification of ownership. Document Aristotle’s reception; cross-link the overlapping Shelley and Aristotle extracts. |
| Q31 | 10 / 6 | High | Ten rows conceal only six works; four long Berdyaev chunks sit beside a selected passage. Several chunks concern organization or emotional life rather than idolatry, and contain broken sentences/endnotes. **Next:** Keep the selected faith-in-technics excerpt as the starting point; reserve the long chunks unless they add a distinct relevant argument after editing against the source. Inspect the already proposed Walker reply to Carlyle. Correct the selected Berdyaev note. |
| Q32 | 9 / 5 | High | Nine rows represent five works. Spengler chunks overlap the selected passage and include endnotes and broken boundaries. Bergson on invention’s disproportionate consequences is not a civilizational ranking argument. **Next:** Prioritize the existing Babbage and Macaulay leads. Retain a compact Spengler passage instead of treating chunks as additional coverage; keep Gandhi’s definition of civilization distinct from Spengler’s use of the term. |
| Q33 | 9 / 5 | High | Nine rows represent five works; five are Spengler. Zhang and Tagore offer direct arguments for selective adoption, Gandhi against it, while the missing preselected East Asian debates could materially change coverage. **Next:** Prioritize Feng, Fukuzawa and Yan from the existing canon suggestions. Reduce the long Spengler chunks to source reserves, retain historically loaded terminology with attribution, and check Veblen’s context before treating delayed change as permanent separability. |
| Q34 | 6 / 6 | High | The set relies heavily on imperial European speakers. Ferry’s short excerpt asserts a civilizing duty without the technological premise; Pearson’s racial struggle is not itself a technological justification. Belloc’s satire must not be coded as endorsement. **Next:** Prioritize the existing Césaire lead for a direct challenge to infrastructure-based justification. Find the fuller Ferry context and distinguish capacity to conquer from a right to govern. |
| Q35 | 5 / 5 | High | The question links a machine conception to a right of redesign. Hobbes’s present quotation concerns private conscience, Spencer industrial organization, and Schiller the difficulty of reform without interruption; none alone establishes that right. **Next:** Correct the Hobbes and Lenin descriptions. Inspect the existing Müller lead and seek a direct construction/redesign argument. Keep Schiller’s practical constraint, and do not infer revolutionary authority from any use of the word machine. |
| Q36 | 6 / 6 | Normal | Kant, Thoreau and Weber directly address role and judgment. Wilson separates politics and administration rather than suspending conscience; Hegel’s universal interest is not mere blind obedience. **Next:** Treat Wilson as a replacement candidate and look for a passage explicitly about an official’s moral discretion. Preserve Kant’s public/private distinction and Weber’s contrast between official and leader. |
| Q37 | 5 / 5 | Normal | Head/Holmes gives a concrete body-schema argument and Butler an explicit extracorporeal-limb account. Marx reverses the relation, making the person an appendage; Kapp’s model/copy claim alone need not imply bodily membership. **Next:** Prioritize the already suggested Merleau-Ponty cane passage if it adds to Head/Holmes, rather than merely repeating it. Consider relocating Marx to labor questions; preserve distinct anatomical, experiential and metaphorical senses of part. |
| Q38 | 7 / 7 | Normal | The excerpts distinguish borrowed power from lost native capacities, but Thoreau’s current passage concerns settled dependence, and Bergson’s retained passage concerns invention’s wider consequences. **Next:** Keep the retained Bergson record as context, not a strong direct answer. Prefer an explicit attribution-of-capability argument if replacing Thoreau; correct its stale note. |
| Q40 | 5 / 5 | Normal | Hoffmann, Villiers and Rilke address imagined reciprocity, solitude and unanswered affection. Descartes tests thought through language rather than whether a known insentient companion can satisfy someone. **Next:** Consider relocating Descartes to Q02 only. Seek a period passage about knowingly nonreciprocal attachment if available, while preserving the distinction between deception and companionship after disclosure. Goethe’s selected speech alone does not show the play’s ending. |

The proposed gaps describe what this selection does not yet establish. They are not claims that the historical corpus lacks those arguments. In particular, a work-level download status does not establish passage availability, a repeated author is not a new independent witness, and a character's statement is not automatically the author's position. Earlier works need evidence of reception within 1600–1950. The existing notes and stance summaries sometimes describe superseded excerpts; the structured audit preserves each discrepant note alongside the correction needed, rather than treating those summaries as evidence.

Rebuild the concordance with `python3 scripts/consolidate-passages.py`; check it with `--check`. The migration tests compare every preserved catalogue and pool record, verify audit coverage, and compare all nine frozen-input hashes with the start of this audit. The legacy catalogue and pools remain the site inputs, so no deployment or study reset is involved.

## Four-question source revision — 28 October 2026

**Codex revision for review.** Ben authorized correction of stale descriptions and stronger passages for Q02, Q03, Q24 and Q26, with the six pilot pools fixed. Twenty descriptions and their linked stance summaries now describe the quotations actually present. Their previous records survive in [the revision ledger](../research/passages/four-question-revision.json). These corrections do not certify inherited draft direction labels. No old quotation or question assignment was deleted or changed.

Six passages were added. The catalogue now contains **255 records**; with the **117 unchanged pilot placements**, the concordance contains **358 distinct excerpt forms**. Q02 and Q03 now have five catalogue records each, Q24 seven and Q26 six. The original audit above records the pre-revision findings; its structured version records resolutions and current counts.

| Question | Addition | What it contributes | Source check |
|---|---|---|---|
| Q02 | Torres Quevedo, *Ensayos sobre Automática* (1914), p.398 | A constructor could prearrange fitting replies without the machine performing its own reasoning. The construction is theoretical, not an accomplished conversational device. | Spanish checked against the Royal Academy scan. One omission marked. Codex translation requires independent review. |
| Q03 | Torres Quevedo, same paper, p.394 | Rejects a simple mental/manual distinction while explicitly requiring rules fixed at construction. It sharpens the distinction between adaptation under rules and learning beyond anticipated cases. | Spanish checked against the printed page; Codex translation requires independent review. |
| Q24 | Fitch, *Lectures on Teaching*, 1883 edition, pp.294–295 | Allow visible aids until abstraction develops; discontinue the abacus once it is no longer needed. | Printed p.295 checked, preceding sentence opening checked against the transcription. |
| Q24 | D. E. Smith, *The Teaching of Arithmetic*, third edition (1909), p.27 | Proficiency in written calculation does not ensure proficiency in unaided mental calculation; the latter needs practice. | Printed p.27 checked; OCR corrected and line wrapping normalized. |
| Q26 | Wells, *The World Set Free* (1914), chapter I, section 2 | Holsten disclaims unforeseeable consequences and invokes another discoverer’s eventual success. His earlier hesitation remains separately preserved. | Checked against the existing Gutenberg transcription. |
| Q26 | Čapek, *Krakatit* (1924), concluding dialogue, chapter LIV | The old man whom Prokop recognizes as God urges him to abandon destructive invention and start again with useful energy. | Checked against the existing Gutenberg transcription: Lawrence Hyde’s **1925 English translation**, not a Czech source text. Catalogue metadata corrected. |

Fitch and Smith are additional review sources, not silently added to the 204 accepted canon works. Their author identifiers are matched; work identifiers remain null. Torres’s original Spanish source is now linked. The saved source texts and checks are in `research/passages/sources/` and the revision ledger. The bounded search began with the canon texts and the Ghosts and Serials corpora, then acquired the original Torres paper and the two teaching books. Newspaper hits and general machine metaphors were not added merely because they matched a query.

Q24 still does not establish that mechanical calculators cause adults to lose an acquired skill: Fitch addresses teaching aids and Smith transfer between written and oral practice. Q03 still needs a fuller learning argument. Turing, Jefferson, Rosenblueth and Wiener remain review leads rather than being marked verified on the strength of summaries. No question wording or final categories were changed to conceal these limits.

### New excerpts for review

**Q02 — q02-quevedo-essays-automatics** (Codex translation)

> Let us imagine a machine like the one represented in the diagram (fig. 2), but with thousands or millions of switches, if necessary, instead of three; and with each switch having, instead of three or four different positions, a position corresponding to each written sign (letters, numerals, punctuation marks, etc.). It is perfectly understandable that these switches could be used to write any sentence, or even a more or less lengthy discourse; this would depend on the number of switches available. Each discourse would correspond to a position of the system, and consequently to an electromagnet. We may suppose that this triggers a phonograph on which the answer to the question that caused its movement has been recorded, and in this way we shall have an automaton capable of discussing everything knowable. […] There is not the difference between the two cases that Descartes saw. He doubtless thought that, to answer reasonably, the automaton would need to perform a reasoning process itself, whereas in this case, as in all the others, its constructor would have thought for it in advance.

**Q03 — q03-quevedo-essays-automatics** (Codex translation)

> The same is not true when the question is whether an automaton can be constructed that weighs its surrounding circumstances in order to determine its acts. It is generally thought that this can be achieved only in a few very simple cases; that a worker’s purely manual, mechanical operations can be automated, but that operations requiring mental faculties can never be performed mechanically. This distinction has no value, since, except for reflex movements, which do not concern us here, mental faculties intervene in all human actions. I shall try to demonstrate in this paper—from a purely theoretical standpoint—that it is always possible to construct an automaton all of whose acts depend on certain more or less numerous circumstances, obeying rules that can be imposed arbitrarily at the time of construction. Evidently these rules must suffice to determine the automaton’s conduct at any moment without uncertainty.

**Q24 — q24-fitch-lectures-teaching**

> It must not be set down as a fault if at first he counts with his fingers. Let him do so by all means if he likes. The faculty of abstracting numbers, and of learning to do without visible and tangible illustrations comes more slowly to some children than others. So long as they get the answer right, let them have what help they want till this power comes. It is sure to come ere long. At first, too, the little questions and problems which are given to children may fitly refer to marbles or apples, or to things which are familiar to them. But the mistake made by many teachers is to continue using these artifices too long; to go on shewing an abacus, or talking about nuts and oranges after the children have fully grasped the meaning of 6 + 5 in the abstract, and are well able to do without visible help. It is a sure test of a good teacher that he knows when and how far to employ such artifices, and when to dispense with them. The moment that concrete illustrations have served their purpose, they should be discarded.

**Q24 — q24-smith-teaching-arithmetic**

> The ordinary purchase of household supplies requires a practical ability in the mental arithmetic of daily life, and this ability comes to the mind only through repeated exercise. As will be seen later, it is a fair inference from statistical investigations that a person may be rapid and accurate in written work but slow and uncertain in oral solutions. Therefore, it will not do, from the practical standpoint, to drill children only in written arithmetic if we expect them to be reasonably ready in purely mental work.

**Q26 — q26-wells-consequences-disclaimer**

> ‘It has begun,’ he writes in the diary in which these things are recorded. ‘It is not for me to reach out to consequences I cannot foresee. I am a part, not a whole; I am a little instrument in the armoury of Change. If I were to burn all these papers, before a score of years had passed, some other man would be doing this. . .

**Q26 — q26-capek-krakatit**

> “It is good. You will do things which will help people. He whose thoughts are full of the highest turns away his eyes from people. Instead you will serve them.” “That is good,” whispered Prokop, on his knees. “Now you see,” said the old man, pleased, and squatted down on his heels. “Tell me, what’s this—what do you call it? Your invention?” Prokop raised his head. “I’ve ... forgotten.” “That doesn’t matter,” the old man reassured him. “You’ll take up other things. Wait a moment, what was it I was going to say? Aha! Why was there such a great explosion? That’s more people injured. But look about and search; perhaps you’ll find ... well, perhaps only such pf-pf-pf,” he said, blowing out his soft cheeks, “you see? So that it should only be puf-puf ... and do something which will work for people, do you understand?” “You mean,” muttered Prokop, “some sort of cheap energy, eh?” “Cheap, cheap,” agreed the old man, delighted. “So that it could be very useful. And shine, and warm, you understand?” “Wait,” said Prokop reflectively, “I don’t know—that would mean experimenting all over again ... from the other end.” “That’s it. Start from the other end and there you are. There, you see, you’ve something to begin with right away. But leave that other. I’ll get your bed ready.”


### Final review before deployment — 28 October 2026

**Codex editorial review, not historian approval.** The six new excerpts and their descriptions were reviewed alongside the four questions and the unresolved 34-question audit. No further passage was removed or added. The six pilot pools and sorting instructions remain fixed. The wider catalogue is ready for Ben’s review, not ready for all 34 questions to enter sorting.

The next changes should be selective: add a direct learning argument to Q03; seek an explicit argument about loss or retention of unaided arithmetic for Q24; and add a nonfiction account of the inventor’s obligations to Q26. Jefferson/Turing for Q02 and Wiener for Q26 remain source-verification leads. Review La Mettrie under Q02 and Russell/Haldane under Q26 as contextual reserves rather than strong direct answers. Keep both Wells excerpts: hesitation before publication and the later disclaimer make different arguments. Check the two new Torres translations independently before using them in a sorting pool. For Q31–Q33, select complete, nonoverlapping excerpts from the long translated chunks before expanding coding. These are recommendations, not implemented exclusions or changes to the fixed pilot.

The display review corrected three problems: question status text no longer attributes all selections to Claude or says none has been checked; question work counts include standalone passages; standalone excerpts display their review status and use an existing corrected reading when available. Original transcriptions remain stored. The broader question pages still show provisional agent arguments; they are not independent sorting inputs or final position keys.

### Final source improvements — 28 October 2026

**Codex selections and translation check for review.** Ben requested stronger Q03/Q24/Q26 sources, checking Torres, and trimming Q31–Q33. The [revision ledger](../research/passages/four-question-revision.json), under `finalImprovement`, preserves prior records, source checks, bounded search queries, and reasons for reserve status. The six pilot pools, instructions and study version are unchanged.

| Question | Implemented change | Limit |
|---|---|---|
| Q03 | Added a brief Turing quotation on the teacher’s limited knowledge of a learning machine, from *Mind* 59 (1950), p.458, checked against the page scan; linked the existing Turing proposal to it. | The continuation permits some prediction of behaviour. Opacity is not itself judgment. Review the full pp.458–459 discussion before preparing a sorting pool. |
| Q24 | Added Fujisawa’s *Summary Report on the Teaching of Mathematics in Japan* (1912), pp.28–29. He explicitly denies that habitual use of a soroban implies inability to calculate mentally and argues for reliability and economy of effort. | This is his historical argument, not an experimental demonstration. English original checked against both printed pages; line breaks and spacing normalized. New work is an additional review source, not silently added to the accepted canon. |
| Q26 | Added a brief Wiener quotation explicitly accepting responsibility for disclosure, from *A Scientist Rebels*, *Atlantic Monthly* 179/1 (January 1947), p.46; checked against the publisher’s scan. | The letter concerns foreseeable military use. It does not establish responsibility for every unforeseen outcome. Review the full paragraph before sorting. |
| Q02/Q03 | Checked both Torres translations against Spanish page images. Restored Q02’s omitted practical-difficulty paragraph in both languages; changed “paper” to “note” in Q03. | Same-agent language review, not independent historian verification. The rules are freely specified by the constructor, not random. No claim of learning beyond those rules is added. |
| Q31–Q33 | Marked eleven long Berdyaev/Spengler extraction chunks as reserves. Retained the focused quotations. | Three Spengler chunks overlap the focused Q32/Q33 selections; the remaining chunks are broad context, with some broken boundaries or endnotes. No claim that all eleven are textual duplicates. |

The catalogue now holds **258 records: 247 active selections and 11 reserves**. Together with the unchanged **117 pilot placements**, the register contains **361 excerpt forms**. Q31 has six active records, Q32 five and Q33 five. Original reserve texts and question links remain in the catalogue and register. Public question/source pages omit reserves; this is a selection change, not deletion. The two brief Turing/Wiener quotations are intentionally bounded and marked as not sorting-ready; full source locations and contextual summaries accompany them. Full copyrighted passage windows have not been silently substituted with agent paraphrases.

The bounded local search also found misdated records (for example a later scientific directory filed as 1906); those results were excluded by inspecting their contents. Newspaper matches and generic machine metaphors were not admitted. No sorting or model coding was run. The next substantive review is of the actual passage wording, context and translation, not another broad search for more rows.

## Institutional Books catalogue and canon additions, 20 November 2026

The archive-harness (`~/Code/archive-harness`) now reads Harvard's
Institutional Books on Hugging Face (`institutional/institutional-books-hl`,
983,004 public-domain books, 958,458 dated 1600–1950). Its local catalogue
(`data/catalogs/instbooks.parquet`, 31 MB) holds title, author, date,
language, subject headings, genre, OCR score and page count. Full text is
fetched one book at a time, about 40 seconds each. Five Claude agents used it
to search for works under Ben's 20 Nov entry rule: 131 suggestions, 119 works.
They are listed as proposals in the canon candidates file, with quotations in
`research/canon-candidates/additions.json`. Searches are logged in the
harness's search log under this project.
