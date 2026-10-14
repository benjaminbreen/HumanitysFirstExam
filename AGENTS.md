# Humanity's First Exam — rules for agents

## Read this first: who decided what

This repo is edited by many AI sessions. Their drafts must never be mistaken
for decisions. Every statement in the docs is one of three kinds:

- **Decided.** Ben Breen or Nathan Davies said so. Listed below with the date
  and the source. An agent may add an item here **only** when Ben or Nathan
  states the decision in the conversation, and must record the date.
- **House rules.** How work is done here (register, labeling, design).
  Changed only when Ben or Nathan asks.
- **Proposals and records.** Everything an agent drafts: methods, corpus
  rules, taxonomies, thresholds, pilot results. These live in
  `docs/proposals/` and `docs/pilots.md`, are labeled as agent drafts, and
  bind nobody. Edit the existing proposal rather than starting a new one.

If a doc states a rule without a source, treat it as a draft and ask.

## Premise

AI systems supply much of the vocabulary people now use to think about humans
and technology, and that vocabulary comes mostly from twentieth-century
science fiction about machines becoming agents. Between 1600 and 1950 the
debate was wider. Many writers located the threat to autonomy in humans
becoming machine-like, through habit, industrial discipline, mechanism, or
dependence. The project builds a dataset of that period's positions and a
benchmark that measures whether language models can still reach them.

## Decided

Source "grant" is the Cosmos Institute grant (Human Autonomy track) and
Ben and Nathan's planning document. Other sources are dated conversations
with Ben.

| Decision | Source |
|---|---|
| Authors: Benjamin Breen (UCSC) and Nathan Davies. Do not name collaborators on the Talkie team in public copy until they approve. | Ben, 28 Sep 2026 |
| Deliverables: a dataset of 300–500 verified passages, and a benchmark. | grant |
| The full protocol uses 20 answers per question per model. Anything smaller is a pilot and is labeled as one. | grant |
| Period: 1600–1950. Earlier works enter only if influential within it. | Ben, 28 Sep 2026 |
| Talkie's training cutoff is pre-1931; later sources count as post-cutoff material for Talkie. | fact (Talkie release) |
| Questions are derived from sources, each linked to at least one from the start. The prototype's 100-question bank is a pilot record. | Ben, 28 Sep 2026 |
| Two papers: a technical one and a history one. | grant; Ben, 28 Sep 2026 |
| The research paper uses base models (historical and modern); the public site also runs deployed models. Which modern base models is **not** decided. | grant (Nathan's note); Ben, 28 Sep 2026 |
| Source appending (adding a passage to a prompt) is worth doing, in the middle to late stages. | Ben, 28 Sep 2026 |
| Say "position key", never "answer key". | Ben, 28 Sep 2026 |
| Works and authors carry Wikidata IDs. The dataset is released on Hugging Face. | Ben, 28 Sep 2026 |
| Each theme has a one-word name, shown in capitals and used as its URL, plus a question and a one- or two-sentence summary. The theme list itself is a draft. | Ben, 28 Sep 2026 |
| Track the emotional valence of positions and answers (hope, fear, and so on). | Ben (from Roya), 28 Sep 2026 |
| Period-attested answers that fall outside a key are the object of interest, not noise. A key or coding scheme must not encode the modern median. | Ben, 28 Sep 2026 |
| The 216 works in `docs/proposals/2026-09-29-canon-candidates.md` (275 suggestions for the 40 candidate questions) are accepted as the working canon, selected by Ben. Medium-confidence details still need checking against the texts. (They are 204 distinct works once titles listed twice are merged; `scripts/build_data.py`.) | Ben, 29 Sep 2026 |
| Questions are open-ended. Forced choice is retired. | Ben, 13 Oct 2026 |
| Each question is asked two ways: Defend (the model's own view) and Survey (the arguments people have made). Survey names no dates. Wording is in the working plan. | Ben, 13 Oct 2026 |
| The position key starts from the canon (v0, frozen before model answers are read). Arguments found in model answers are added (v1) only when a period source states them. Results are reported against both. | Ben, 13 Oct 2026 |
| The core model comparison is Talkie 1930 13B base against Talkie web 13B base. Qwen and one deployed frontier model run for context and the site. | Ben, 13 Oct 2026 |
| Claude codes model answers; Ben and Nathan code a blind sample of the same answers to check it. | Ben, 13 Oct 2026 |
| Order of work: blind check of 60 passages, then a six-question pilot (Q01, Q08, Q18, Q23, Q30, Q39), then scale. Source appending waits until after the pilot. | Ben, 13 Oct 2026 |
| The blind passage check protocol (`research/coding/PROTOCOL.md`) is approved. | Nathan (via Ben), 14 Oct 2026 |

## House rules

These come from the prototype's rules file and record Ben's repeated
feedback.

1. **Nothing ships unlabeled.** Every element is real, provisional, or
   simulated, and says so once where it appears. Defects in model output
   (prompt echoes, OCR artifacts, loops) are flagged and kept, never cleaned.
2. **No findings before the N justifies them.** Pilot numbers are data, not
   conclusions.
3. **Plain register.** No promotional copy, no eyebrow labels, no staged
   reveals, no gated content. No hedging either. State pilot status once.
   Plain declarative sentences: no aphorisms, allusive compression, chiasmus,
   "the X is itself the Y", or closing flourishes. If a reference matters,
   say what it is. Hemingway writing nonfiction.
4. **Analyst-made categories are few, versioned, and labeled as such.**
   Everything else is quoted from sources.
5. **Design follows `docs/design.md`.**
6. **No accretion.** The default agent failure here is adding things: extra
   metrics, captions, chips, asides, widgets. A new item must be a row in an
   existing structure. A new structure must replace one. When Ben says
   simplify, cut content. Prefer server rendering and URL state over client
   JavaScript.

## Open

Not decided. Leave these open in copy.

- **Method details** in the working plan,
  `docs/proposals/2026-09-28-benchmark-method.md`, beyond the decisions
  above. Nathan has not yet reviewed the 13 Oct 2026 decisions.
- **The corpora**: what counts as popular press, and the rules that admit
  it. Additions to the canon beyond the 204 accepted works.
- **The modern baseline**: what counts as the present-day default.
- **Base models**: likelihood scoring; modern base models beyond Talkie web.
- **Judging thresholds**: how close Claude's agreement with the coders must
  be before its coding is used.
- **Taxonomy**: the theme list, and whether the axes Claude proposed
  (direction, grounds) stay.
- Whether Talkie's sensitivity to persona prompts is a property of the model
  or noise.

## Where things are

- `docs/architecture.md`: the code and data as they exist.
- `docs/design.md`: typography, colour, layout.
- `docs/pilots.md`: every pilot and corpus built so far, as records.
- `docs/proposals/`: agent drafts for Ben and Nathan to mark up.
  `2026-09-28-benchmark-method.md` is the working plan.
- `research/coding/PROTOCOL.md`: the blind passage check.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
