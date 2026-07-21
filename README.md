# Humanity's First Exam

Research-prototype site for a Cosmos Institute proposal by Benjamin Breen
and Nathan Davies. The method: pose 100 questions about machines and human
autonomy in period-native language; sample Talkie (a 13B model trained only
on pre-1931 text) twenty times per question and a modern frontier model
twenty times under the same protocol; cluster both distributions; and set
the results against cited primary sources so the reader can check the
machine against the record. The site shows the full question bank, three
worked topic pages, and the corpus holdings.

**Everything the site shows is driven by one file:**
`src/data/site_bundle.json`. Provenance (also shown in the site footer and
the home page honesty box):

- **Real:** the questions; the primary-source passages (those marked
  `verified: true` were checked verbatim against full texts in
  `historical-corpus-builder` and the `William Jamesiana` collection); the
  modern answers, written by a frontier model (Claude) during mockup
  construction.
- **Simulated:** every Talkie sample and all cluster counts are hand-written
  illustrations. The week-one pilot replaces them with real draws.

## Stack

- [Next.js](https://nextjs.org) (App Router, static generation) + TypeScript
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- No backend — the bundle is imported at build time; every page prerendered.

## Layout

```
src/
  data/site_bundle.json     ← worked topics: surveys, clusters, passages, notes
  data/question_bank.json   ← the full 100-question bank (Nathan Davies)
  data/corpus_works.json    ← 1860–1930 holdings exported from historical-corpus-builder
  lib/types.ts              ← schema: Topic, Survey, Cluster, SourcePassage, Question
  lib/data.ts               ← typed access + band/family display metadata
  components/
    SurveyBlock.tsx         ← distribution bars + draw-an-answer + sample sheet
    QuestionBank.tsx        ← condensed/expandable 100-question listing
    SourcePassageCard.tsx   ← cited primary source with verified/approximate badge
    BandBadge.tsx
  app/
    page.tsx                ← overview, worked examples, question bank, method, status
    topics/[slug]/page.tsx  ← one topic: both distributions, sources, curatorial note
    sources/page.tsx        ← cited passages + corpus holdings table
```

## Conventions worth keeping

- Cluster `label`s must be phrases quoted from the samples — the clustering
  model may not import its own categories.
- Simulated content always carries the amber "simulated" badge; primary
  sources carry a verified/approximate badge. Don't ship either unlabeled.
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
