# Humanity's First Exam

Research-prototype site for a Cosmos Institute proposal by Benjamin Breen
and Nathan Davies. The method: pose 100 questions about machines and human
autonomy in period-native language; sample Talkie (a 13B model trained only
on pre-1931 text) twenty times per question and a modern frontier model
twenty times under the same protocol; cluster both distributions; and set
the results against cited primary sources so the reader can check the
machine against the record. A planned second bank of modern-native
questions, distilled from a contemporary reference corpus, gets mapped onto
the first by embedding similarity and a quoting LLM judge — see `/relationships`.

## What is real and what is not

Stated in the site footer, the home-page status section, and per-element
badges. As of `prototype-0.4`:

- **Real:** the 100-question bank (Nathan Davies); the corpus holdings on
  `/sources`; the primary-source passages marked `verified` (checked
  verbatim against local full texts, or re-verified by passage id against
  the Premodern Concordance and William Jamesiana databases); all draws on
  `/erewhon` (24, real Talkie + Claude under four temporal framings) and
  `/live` (18, nine supplied Talkie completions and nine independent GPT-5
  Codex runs, prompt echoes retained).
- **Provisional:** the modern answers on the three topic pages, written by
  Claude during mockup construction; the pipeline replaces them with N=20
  API draws.
- **Simulated:** Talkie samples and cluster counts on the topic pages —
  hand-written illustrations, always badged. The week-one pilot replaces
  them with real draws.
- **Designed, not run:** the relationship map (`/relationships`). The
  25-document modern reference corpus it needs is collected in
  `data-local/lesswrong/` (gitignored; not otherwise used by the site).

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
  data/live_runs.json          ← real draws: Q3/Q19/Q29, both models, verified passages
  data/relationships.json      ← the two-bank relationship-map design
  data/codebook.json           ← fixed coding frame applied to clusters and passages
  data/corpus_works.json       ← 1860–1930 holdings from historical-corpus-builder
  lib/types.ts                 ← schema for all of the above
  lib/data.ts                  ← typed access + band/family display metadata
  components/                  ← SurveyBlock, QuestionBank, SourcePassageCard,
                                 HumanAnswer (local-only reader answers), badges/chips
  app/
    page.tsx                   ← overview, live results, topics, bank, method, status
    erewhon/page.tsx           ← the Erewhon test (four framings, 24 draws)
    live/page.tsx              ← live draws (three questions, 18 draws, sources)
    relationships/page.tsx     ← the relationship map (design)
    codebook/page.tsx          ← the coding frame
    topics/[slug]/page.tsx     ← one worked topic: distributions, sources, note
    sources/page.tsx           ← cited passages + corpus holdings table
```

`data-local/` holds working corpora that never ship in a build. The sibling
`humanitys-first-exam-codex/` repo was a parallel-prototype comparison
exercise (July 2026); its real model runs and verified passages were ported
here (`live_runs.json`), and its source-importer pattern is worth reusing
when the pipeline is built.

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
