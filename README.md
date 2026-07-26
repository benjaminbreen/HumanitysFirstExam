# Humanity's First Exam

```text
 _   _ _   _ __  __    _    _   _ ___ _______ __   __ ' ____
| | | | | | |  \/  |  / \  | \ | |_ _|_   _| \ \ / /  / ___|
| |_| | | | | |\/| | / _ \ |  \| || |  | |    \ V /   \___ \
|  _  | |_| | |  | |/ ___ \| |\  || |  | |     | |     ___) |
|_| |_|\___/|_|  |_/_/   \_\_| \_|___| |_|     |_|    |____/

 _____ ___ ____  ____ _____   _______  __    _    __  __
|  ___|_ _|  _ \/ ___|_   _| | ____\ \/ /   / \  |  \/  |
| |_   | || |_) \___ \ | |   |  _|  \  /   / _ \ | |\/| |
|  _|  | ||  _ < ___) || |   | |___ /  \  / ___ \| |  | |
|_|   |___|_| \_\____/ |_|   |_____/_/\_\/_/   \_\_|  |_|
```

**Humanity's First Exam asks what present-day AI leaves out when it answers
questions about machines and human autonomy.**

The project builds a multilingual collection of historical arguments and uses
them as an answer key for comparing language models. It is a collaboration
between historians Benjamin Breen and Nathan Davies and the Talkie team.

## The idea

Current AI debates often begin with a recent vocabulary: alignment, control,
optimization, and autonomous agents. Earlier writers approached many of the
same problems through arguments about habit, free will, industrial discipline,
dependence, judgment, progress, and self-government.

The corpus centers on 1850–1940, when industrialization, evolutionary theory,
mass politics, and new calculating technologies transformed these debates. It
also includes a small number of earlier works, such as Hobbes and Descartes,
whose arguments remained influential during this period.

The exam asks whether present-day models can still reach this wider range of
positions.

## How it works

1. **Build the historical answer key.** Select primary-source passages and
   code the distinct positions they attest.
2. **Write matched questions.** Ask each question in contemporary and
   period-appropriate language.
3. **Sample the models repeatedly.** Compare Talkie-1930, a language model
   trained on text published before 1931, with present-day frontier and
   open-weights models.
4. **Measure range.** Record each answer's verdict and primary reason, then
   count which historically attested positions each model reaches.

The full protocol uses 20 draws per question and model. Coding follows the
position an answer actually occupies, not every position it mentions.

## At a glance

| | Current project |
|---|---:|
| Question bank | 100 questions |
| Evidence catalogue | 63 sources with selected passages |
| Readable source texts | 61 |
| Languages represented | 13 |
| Planned verified dataset | 300–500 passages |
| Respondent classes | Talkie, frontier models, open-weights models |

The question bank is preliminary and will be refined against the completed
historical corpus.

## What is live now

The site includes:

- the complete 100-question bank;
- the searchable historical evidence catalogue;
- full source texts where local reading copies are available;
- real, unedited model draws from several pilot tests;
- a worked benchmark question with positions anchored in primary sources;
- the coding frame used to compare answers.

The current tests are illustrative pilots, not final benchmark results. Small
cells are presented as data with things to watch, never as findings. Prompt
echoes, loops, and other model-output defects are flagged and retained.

## Repository guide

```text
src/
  app/                 pages for the public research site
  components/          question, source, and experiment views
  data/                question bank, source records, coding, and model draws
  lib/                 shared types and data access
bench/
  reckoning/           worked benchmark case, prompts, runs, and judgments
research/              source discovery and passage-selection records
scripts/               reproducible ingestion, validation, and scoring tools
```

The detailed research design and project rules live in [`AGENTS.md`](AGENTS.md).

## Run locally

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To verify a production build:

```bash
npm run build
```

The site uses Next.js, TypeScript, and Tailwind CSS. Public pages are generated
from versioned local data files; no database is required.

## Rebuild the source data

The multilingual passage data and reading-copy index can be regenerated from
the tracked research records:

```bash
node scripts/ingest-historical-passages.mjs
node scripts/ingest-historical-passages.mjs --check
node scripts/build-historical-source-texts.mjs
```

The worked question-level answer key has its own ingestion and scoring path:

```bash
node scripts/ingest-answer-key-prototype.mjs
node scripts/ingest-answer-key-prototype.mjs --check
node scripts/score-answer-key.mjs \
  --responses=research/answer-key-prototype/q33-scoring-fixture.json
```

The included response fixture is synthetic and tests the scorer only. Its
scores are not presented as benchmark results.

## Research integrity

- Every public element is labeled as real, provisional, or simulated.
- Primary-source claims retain a source and locator.
- Working translations remain provisional until language review.
- Raw model outputs are retained rather than silently cleaned.
- The project measures what models can readily say, not the contents of their
  training data.

## Team

- **Benjamin Breen**, University of California, Santa Cruz
- **Nathan Davies**, historian and question-bank author
- **Nick Levine and Alec Radford**, Talkie

Humanity's First Exam is being developed for the Cosmos Institute's Human
Autonomy program.
