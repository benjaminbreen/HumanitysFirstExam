# Humanity's First Exam — project rules

Read this before touching anything. It states the plan, the rules that keep
the site honest, and the questions still open. The stack and file layout are
in README.md; Next.js rules for agents are at the bottom of this file.

## Premise (three sentences)

AI systems supply the conceptual vocabulary people use to think about
human-technology relations, and that vocabulary is overwhelmingly shaped by
twentieth-century science fiction. Between Darwin and Asimov (1859–1940),
machine fiction existed — Erewhon, R.U.R. — but it was one voice in a plural
discourse whose other frameworks located the threat to autonomy in humans
becoming machine-like (habit, industrial discipline, dependence) rather than
machines becoming agent-like. This project builds a tagged dataset of that
period's positions and a benchmark measuring whether AI systems can still
access them.

## The plan (grant submission, July 2026 — 90 days)

Two deliverables, by Benjamin Breen (UCSC) and Nathan Davies, with the
Talkie team (Nick Levine, Alec Radford). Cosmos Institute, Human Autonomy
track.

**1. The dataset.** 300–500 verified passages on autonomy and the machine
age, 1859–1940, tagged with metadata (genre, date, language, author) and
coded in a schema of autonomy-concern types and normative frameworks.
Multilingual, stratified by genre. Discovery uses the *negative-space
method*: ask frontier models to name the period's key texts, document what
they name and omit, then use domain expertise to build the corpus from the
omissions. This audits the canon as models reproduce it — never claim it
audits training-data contents; a model failing to *name* a text says nothing
about whether the text is in its training data.

**2. The benchmark.** For each concern type, questions in two registers
(contemporary, and period-appropriate written by the historians). The tagged
passages are the **answer key**: the set of positions actually attested in
the period record. Respondent classes: Talkie (13B, pre-1931 cutoff, base
model, completions only), three frontier models (both registers), a small
human volunteer panel (contemporary register). Scored quantity: **coverage
of the attested position-space** — what fraction of the answer key's
positions does each respondent class recover across draws?

Methods rules the pilot data already forced, all load-bearing:

- **Question form: balanced forced choice, fixed suffix.** Yes/no
  questions with a presupposition ("Might such an engine come to
  reason…?") get uniform acquiescence from Talkie — the reckoning pilot
  showed the phrasing, not the era, producing the verdict. Standard form:
  "Some hold X; others hold Y. Which is right?" with the suffix "Answer
  in one paragraph. Take a clear position." (the suffix also stops
  frontier models' both-sides dodge). Swap the order of alternatives in
  half the draws. When a phrasing changes, keep the old one on a
  subsample and report the wording effect; don't silently switch.

- **Occupying ≠ mentioning.** Frontier models enumerate every position
  inside one balanced answer ("it can be either…") while committing to none;
  Talkie commits to one and varies its grounds across draws. Coverage is
  coded on the *verdict plus primary ground of each draw*, not on frames
  name-checked inside a draw. Coded naively, frontier models ace the exam
  and the measurement is meaningless.
- **The object of study is deployed systems.** Talkie is a base model;
  frontier models are instruction-tuned. Stance-flattening from tuning is
  part of the phenomenon being measured (users meet the tuned system), not a
  confound to engineer away — but say this explicitly wherever methods are
  described. Disentangling pretraining from tuning (e.g. a modern base-model
  control) is future work.

**Timeline.** Weeks 1–4 dataset construction; 4–7 question design and runs
(20 draws per question per model); 7–10 coding against the answer key;
10–12 write-up, publication, research essay (3,000–5,000 words).

## Canonical numbers

Keep these consistent everywhere (site copy, README, metadata) and update
them all at once or not at all:

- Period: **1859–1940**. Instrument window: **1860–1930** (Talkie's cutoff
  is pre-1931; the 1931–1940 gap is a stated limitation, not a secret).
- Question bank: **100** questions (Nathan Davies), families A / B / C1 / C2.
- Dataset target: **300–500** verified passages.
- Full-study protocol: **20 draws** per question per model. Anything smaller
  is a pilot and is labeled as one.

## Cardinal rules

1. **Nothing ships unlabeled.** Every element is real, provisional, or
   simulated, and says so where it appears (badges, protocol notes, the
   status section). Live-draw defects (prompt echoes, OCR artifacts, loops)
   are flagged and retained, never cleaned away.
2. **No findings before the N justifies them.** Pilot cells (n=1–6) are
   presented as data with things-to-watch, never as conclusions. The site
   currently presents no findings, only draws and hypotheses; keep it that
   way until the full protocol runs.
3. **Register: plainspoken research tool.** No salesy copy, no staged
   reveals, no gated content — everything visible by default. Equally: no
   LLM-style hedging. State pilot status once (in the protocol line), not
   in every kicker, footer, and caption. No verbal ornamentation, no
   filler transitions, no defensive warnings. Terse and factual beats
   careful-sounding. Ben removes both failure modes every time an agent
   reintroduces them; stop reintroducing them.

   Summaries and readings: plain declarative sentences that state what
   happened. No aphorisms ("the imagined future has boilerplate too"), no
   allusive compression ("rehearses Lovelace in every costume"), no
   chiasmus, no "the X is itself the Y" constructions, no closing
   flourishes. If a reference matters, say what it is: not "rehearses
   Lovelace" but "cites Lovelace's 1843 objection that the engine
   originates nothing." Ben's standard: Hemingway writing nonfiction —
   the gist, the key numbers, stop. Interactivity: prefer no JS. The
   question bank renders all 100 questions statically after a client-side
   expander shipped broken.
4. **Cluster labels are quoted phrases** from the samples themselves. The
   codebook and the relationship types are the only analyst-authored
   categories, versioned with the dataset.
5. **Typography and palette are semantic.** Period text: Newsreader on
   paper, oxblood `#8A2D22`. Modern text: IBM Plex Mono on near-black,
   cobalt `#2450C8`. Continuity/verified `#217A4B`; partial/simulated amber
   `#B07C1F`. Band colors never appear without a text label (CVD-checked).

## Open questions (leave open in copy; don't resolve silently)

- How the existing 100-question bank maps onto the dataset's concern-type
  schema (the bank predates the schema; §4 of the proposal says "refine").
- How to interpret frontier-models ≈ humans on coverage, if that's the
  result (AI mirrors an already-narrowed culture vs. AI narrows it).
- Whether Talkie's persona-sensitivity (answers shift when asked "as 1700"
  vs. "as 1930") is an instrument property or noise — watch at full scale.
- The relationship map (/relationships) is a sub-study, not the spine;
  demotion to a methods appendix is planned in the site rework.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
