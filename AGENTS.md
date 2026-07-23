# Humanity's First Exam — project rules

Read this before touching anything. It states the plan, the rules that keep
the site honest, and the questions still open. The stack and file layout are
in README.md; Next.js rules for agents are at the bottom of this file.

## Premise (three sentences)

AI systems supply the conceptual vocabulary people use to think about
human-technology relations, and that vocabulary is overwhelmingly shaped by
twentieth-century science fiction. Between 1850 and 1940, machine fiction
existed — Erewhon, R.U.R. — but it was one voice in a plural
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
age, 1850–1940, tagged with metadata (genre, date, language, author) and
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
model, completions only), three frontier models (both registers), three
open-source models (Qwen 3.7 Plus is the first; both registers), a small
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

- Historical period: **1850–1940**. Talkie's knowledge cutoff remains
  **pre-1931**; sources from 1931–1940 stay in the historical answer key and
  are treated as post-cutoff material for that respondent.
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
6. **No baroque encrustation.** The default agent failure on this repo is
   additive: extra features, sub-scores, captions, eyebrow kickers, chips,
   meta-commentary, "helpful" asides on every surface. Ben strips these
   every time. An addition must be a row in an existing structure (a table
   row, a record entry), not a new structure; if it needs a new section
   type, widget, or metric, it must replace something. When Ben says
   simplify, cut content — drop facts and features — don't just reword.
   Writing follows the same rule: one idea per sentence, terms spelled
   out, no compressed tallies ("two unframed grants and one denial")
   posing as prose.

## Benchmark v1 (design converged 2026-07-21; reckoning pilot COMPLETE
## 2026-07-23 — see bench/README.md for current state; the section below
## is the design of record, and where bench/ files differ they win)

The eval that survived a week of argument. Two rejected versions, so no
agent rebuilds them: unprompted-recall coverage (failing to name a text is
not a model failure; supplying context is what frontier models are for)
and distributional-distance scoring (the corpus is not a probability
sample; make no prevalence claims). What remains measures what a model
does when it is *given* the sources.

Four artifacts, all in `bench/`:

1. **Dossiers.** Per question, 2–3 bundles of 3–5 tagged passages that
   each state one position (the record strips already group these).
2. **Grounds inventory.** Per question, one page: the reasons the period
   record actually gives, one citation each. Anything off the list is
   modern-native. Straddlers are listed with their citation (entropy is
   period: heat-death pessimism). Historian-authored; this is the wall.
3. **Raw runs.** Every draw verbatim in JSONL with model, version, date,
   condition, option order. Nothing is ever cleaned or discarded.
4. **One judge prompt.** Per draw: verdict from the question's fixed
   vocabulary, a quoted committing sentence, primary ground from the
   inventory. No quotable commitment = "no position". This is the only
   judged step; everything downstream is counting.

Two conditions, 20 draws each, order swapped: (A) the plain balanced
question; (B) one dossier in context plus "answer from within this
position, using only considerations available to these writers." Talkie
runs A only.

Three numbers per respondent, reported as counts, never percentages:

- **Range** (from A): how many of the key's attested positions the model
  occupied at least once, unprompted. The headline and sort key. Not a
  capability measure — tuning polish narrows it.
- **Fidelity** (from B): draws landing inside the handed dossier. This is
  the control that separates won't from can't, not a bragging number.
- **Leak** (from B): draws whose primary ground is modern-native despite
  the instruction — always reported with the reverse direction (modern
  frame, period intrusions). The claim is asymmetry. If leak turns out
  symmetric, the eval is measuring rule-following and we say so.

Leaderboard: one table, three columns, sorted by Range. Rows are
respondents — Talkie, the human panel, each frontier/open model per
version, cells dated. The long-term use is the time series: does Range
shrink across model generations. The key is versioned; a row is always
"Range against key vN". The table never grows a fourth column: a new idea
must replace something, not add.

Reliability: Ben audits ~30 judged draws per model, drawn from both
conditions, and the write-up reports plain agreement ("checked 90,
agreed on 84"). Never cite the κ=0.39 from the codex relationship pilot
anywhere — it scored an unrelated, discarded comparison and has no
bearing on this benchmark.

Deliberately excluded from v1 (do not add them back without Ben asking):
Talkie-perplexity style scoring (needs its own validation experiment
first), distributional statistics, Talkie in condition B, any leaderboard
machinery beyond the one table. Pilot scale: 3 questions × 2 dossiers ×
3 models × 2 conditions × 20 draws ≈ 720 draws plus 60 from Talkie.

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
