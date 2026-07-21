# Humanity's First Exam

Research-prototype site for a Cosmos Institute proposal by Benjamin Breen
and Nathan Davies. **The plan of record lives in AGENTS.md — read it
first.** In brief: a tagged dataset of 300–500 verified passages on
autonomy and the machine age (1850–1940) serves as the answer key for a
benchmark; questions are posed in contemporary and period registers to
Talkie (a 13B model trained only on pre-1931 text), three frontier models,
three open-source models (Qwen 3.7 Plus is the first), and a human panel,
20 draws per question per model; the scored quantity is
coverage of the position-space the historical record attests, coded on each
draw's verdict and primary ground. An earlier sub-study mapping a
modern-native question bank onto the period one survives at
`/relationships`.

## What is real and what is not

Stated in the site footer, the home-page status section, and per-element
badges. As of `prototype-0.6`:

- **Real:** the 100-question bank (Nathan Davies); the 10-source,
  seven-language historical passage pilot on `/sources`; the older corpus
  holdings inventory; the primary-source passages marked `verified`; all draws on
  the results pages — `/erewhon` (24), `/engine` (18), `/live` (18),
  `/persona` (13), `/governance` (19), `/companionship` (16), `/virtue`
  (18), `/reliance` (6), `/reckoning` (20), `/progress` (25),
  `/subjection` (10) — and the 12 judged pairings on
  `/relationships`, from
  `research/modern-bank-pilot/` (source-anchored modern questions,
  embedding retrieval, two independent raters, κ reported). Real does not
  mean conclusive: pilot cells run n=1–6 and are held as data, not
  findings.
- **Translation review required:** nine of the ten multilingual pilot
  passages have working English translations. Their original text, source,
  and locator have been checked, but the English rendering is not treated as
  final until reviewed by a reader of the source language.
- **Provisional:** the modern answers on the three topic pages, written by
  Claude during mockup construction; the pipeline replaces them with N=20
  API draws.
- **Simulated:** Talkie samples and cluster counts on the topic pages —
  hand-written illustrations, always badged. The week-one pilot replaces
  them with real draws.

## Stack

- [Next.js](https://nextjs.org) (App Router, static generation) + TypeScript
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- No backend — the data is imported at build time; every page prerendered.

## Layout

```
src/
  data/site_bundle.json        ← worked topics: surveys, clusters, passages, notes
  data/question_bank.json      ← the full 100-question bank
  data/erewhon_experiment.json ← real draws: Q76 under four temporal framings
  data/engine_experiment.json  ← real draws: the engine opening under three framings
  data/persona_experiment.json ← real draws: modern-bank M009, both directions
  data/governance_experiment.json ← real draws: Q82 under a social-role framing
  data/companionship_experiment.json ← real draws: affection for a speaking machine, five framings
  data/virtue_experiment.json  ← real draws: engineered virtue (the hedge), seven framings
  data/reliance_experiment.json ← real draws: reliance on thinking machines, four personas
  data/reckoning_experiment.json ← real draws: engine reason/will in two phrasings (wording effect)
  data/live_runs.json          ← real draws: Q3/Q19/Q29, both models, verified passages
  data/historical_passages.json ← generated multilingual passage pilot
  data/q33_answer_key.json    ← generated worked answer key: attestations → positions
  data/relationships.json      ← relationship types + predictions
  data/relationship_map.json   ← the judged pilot map (from research/modern-bank-pilot)
  data/codebook.json           ← fixed coding frame applied to clusters and passages
  data/corpus_works.json       ← 1850–1940 holdings from historical-corpus-builder
  lib/types.ts                 ← schema for all of the above
  lib/data.ts                  ← typed access + band/family display metadata
  components/                  ← SurveyBlock, QuestionBank, source-passage cards,
                                 HumanAnswer (local-only reader answers), badges/chips
  app/
    page.tsx                   ← overview, live results, topics, bank, method, status
    demo/page.tsx              ← worked public format: question, divergence map, sources, evidence
    questions/page.tsx         ← the complete 100-question bank
    method/page.tsx            ← concise protocol + links to the evidence archive
    erewhon/page.tsx           ← the Erewhon test (four framings, 24 draws)
    engine/page.tsx            ← the self-altering engine (three framings, 18 draws)
    persona/page.tsx           ← the persona question (modern bank, 13 draws)
    companionship/page.tsx     ← the companionship question (16 draws, pilot)
    virtue/page.tsx            ← the hedge question (18 draws, pilot)
    reliance/page.tsx          ← the reliance question (6 draws, pilot)
    reckoning/page.tsx         ← reason or reckoning (20 draws, two phrasings)
    examinees/page.tsx         ← the three respondent classes
    live/page.tsx              ← live draws (three questions, 18 draws, sources)
    relationships/page.tsx     ← the relationship map (pilot: 12 judged pairs)
    codebook/page.tsx          ← the coding frame
    topics/[slug]/page.tsx     ← one worked topic: distributions, sources, note
    sources/page.tsx           ← historical reference set: cited passages + corpus holdings
    sources/[id]/page.tsx      ← individual source record + full locally held text
    answer-key/q33/page.tsx    ← worked benchmark slice: Q33 positions + evidence
```

Nav is Demo / Questions / Sources / Method. The
relationship map and topic pages stay reachable from the method section and
the page-format section; they are sub-studies, not the spine.

`data-local/` holds working corpora that never ship in a build. The sibling
`humanitys-first-exam-codex/` repo was a parallel-prototype comparison
exercise (July 2026); its real model runs and verified passages were ported
here (`live_runs.json`), and its source-importer pattern is worth reusing
when the pipeline is built.

The multilingual passage dataset is reproducible from the research ledger,
source manifest, codebook, question bank, and locally held source files:

```bash
node scripts/ingest-historical-passages.mjs
node scripts/ingest-historical-passages.mjs --check
node scripts/build-historical-source-texts.mjs
```

The first question-level answer-key prototype is generated and scored separately:

```bash
node scripts/ingest-answer-key-prototype.mjs
node scripts/ingest-answer-key-prototype.mjs --check
node scripts/score-answer-key.mjs \
  --responses=research/answer-key-prototype/q33-scoring-fixture.json
```

The included response fixture is labeled synthetic and exists only to test the
scorer. No fixture scores are presented as benchmark results. Draft human-coding
rules live in `research/answer-key-prototype/CODING.md`.

## Conventions worth keeping

- Cluster `label`s must be phrases quoted from the samples — the clustering
  model may not import its own categories. The codebook and the four
  relationship types are the only analyst-authored categories, and both are
  versioned with the dataset.
- Simulated content always carries the amber "simulated" badge; primary
  sources carry a verified/approximate badge; live-draw defects (prompt
  echoes, loops) are flagged and retained, never cleaned away. Don't ship
  any of these unlabeled.
- Two typographic registers: period text is Newsreader on paper (oxblood),
  modern text is IBM Plex Mono on near-black (cobalt). Band colors
  (native/partial/horizon) were validated for contrast and CVD separation
  and never appear without a text label.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (all routes prerendered)
```

## Deploy on Vercel

1. Push this directory to a GitHub repo.
2. [vercel.com/new](https://vercel.com/new) → import the repo. If the repo
   root is the parent folder, set **Root Directory** to `humanitys-first-exam`.
3. Framework preset: Next.js — defaults are correct. Deploy.
