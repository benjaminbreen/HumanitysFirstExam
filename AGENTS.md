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

**Do the work; don't ask for sign-off.** Ben has Nathan's delegation and can
direct any change alone. When Ben asks for something, do it. That covers fixing
texts, swapping passages, correcting OCR, and changing working procedures. It
needs no "decision", "amendment", or joint approval, and no extra
documentation. Do not tell Ben that something needs Nathan's agreement. The
Decided table records the major choices about scope and research design, not
every fix.

**Independent sorting runs:** read only the supplied task prompt and passage
inputs. Do not load the study procedure, researcher discussions, repository
history or prior categories into a sorting run. The methodology and provenance
instructions are for the coordinator, not part of the sorting prompt.

**Current position-key method:** for development or coordination, read
`research/keys/PROCEDURE.md` before working on keys or `/keys`. Ben fixed the four-sorter procedure on 17 Oct
2026: two historians, Opus 5.5 (Medium) and GPT-6.1 Sol (Medium); independent
sorting; two agreement measures; a human-only reference; review of each agent's category meanings;
then the final key. All four receive the same written sorting instructions.
Only the Ben–Nathan comparison is revealed before all six human-only references
lock; all agent results stay hidden until then. Further use of an agent is
decided after the review, with no threshold set in advance (Ben, 28 Oct 2026). This file
records the decision; PROCEDURE.md gives the
steps. The working plan links to it. Older protocols and the current app
are not alternative authorities. The app implements the study-wide gates;
`docs/architecture.md` records its storage, run-import and verification details. Do not resume the retired passage check or the
earlier three-sorter method. Keep later changes in the existing procedure
and record Ben's or Nathan's instruction; do not create competing plans.

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
| Order of work: a six-question pilot (Q01, Q08, Q18, Q23, Q30, Q39), then scale. Source appending waits until after the pilot. | Ben, 13 Oct 2026; amended 14 Oct 2026 |
| The 60-item yes/no passage check is retired. Its protocol (`research/coding/PROTOCOL.md`, approved by Nathan via Ben on 14 Oct) is kept as a record. `/coding` redirects to `/keys`. | Ben, 14 Oct 2026; confirmed 17 Oct 2026 |
| Steering experiments (pushing neurons or directions inside a model) may use both base and chat-tuned open-weight models, such as Talkie 1930 13B base and its chat model. The aim is an exploratory platform for interpreting how models, frontier models included, represent these questions. Closed models such as Opus 5.5 can only be asked, not steered. | Ben, 28 Oct 2026 |
| Position-key validation follows `research/keys/PROCEDURE.md`: Ben, Nathan, Opus 5.5 (Medium) and GPT-6.1 Sol (Medium) independently create positions and sort the same six passage pools under the same written instructions (at most 15 positions, each with an answer, reason and direction; one place per passage). All independent sortings lock before comparisons are revealed. Only Ben–Nathan results are shown before all six human-only references lock; all agent results stay hidden until then. Direction and argument grouping are measured separately. The historians then assess each agent's recovered, missed and unsupported positions and supported discoveries. Preserve the human references before adding jointly accepted agent-only positions to the final v0 keys. Each agent is assessed separately; further use is decided after review, with no advance threshold (Ben, 28 Oct 2026). Further use requires historian checks. | Ben, methodology discussion and request to fix the final plan in writing, 17 Oct 2026; ordering and shared instructions clarified after Ben supplied Opus's review that day; replaces the earlier three-sorter procedure; Ben selected Opus 5.5 and GPT-6.1 Sol, both at Medium, later on 17 Oct 2026 |

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
- **Judging thresholds**: the threshold for later coding of benchmark answers
  (a separate test from key validation).
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
- `research/keys/PROCEDURE.md`: authoritative four-sorter procedure, fixed 17 Oct 2026. Passage pools in `pools.json`; `claude.json` is a preparatory draft, not a documented final-protocol run. Pages: `/keys` (implementation and run-import details in architecture).
- `research/coding/PROTOCOL.md`: the retired 60-item passage check, kept as a record.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
