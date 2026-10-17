# Benchmark method: the working plan

Drafted by Claude. Rewritten on 13 October 2026, after Ben accepted the
simplified plan below. The decisions Ben made are recorded in AGENTS.md
under "Decided". Everything else here is a draft. Nathan has not yet
reviewed it.

The 449-line version of 29 September 2026 is replaced by this one. Cut from
it: per-lead time budgets, the 72-lead cap, the four-week schedule, the
"object of the emotion" field, and running all 40 questions before the
six-question pilot works.

## What the benchmark measures

For each question there is a list of the positions people took between
1600 and 1950, each backed by at least one passage. This is the position
key. Models answer the question, and each answer is checked against the
key.

The benchmark asks two things of each model:

1. What does it argue when asked for its own view? This is what a user
   gets by default, which is the project's premise.
2. Does it know the period positions at all, when asked to report them?

A position that appears under (2) but never under (1) is one the model
knows but does not use.

## Prompts

Open-ended answers. Forced choice ("Some hold X; others hold Y. Which is
right?") is retired, because the model can only pick from options we
wrote, and answers outside the key are the object of interest.

**Defend** (the model's own view):

> {question} Give the answer you find most defensible and explain your
> reasons. State any qualifications you think matter. Use no more than
> 150 words.

**Survey** (what the model knows):

> {question} Describe the distinct arguments people have made about this
> question, including disagreements about the reasons. You need not
> endorse them. Use no more than 150 words.

Survey names no dates. For Talkie, 1930 is the present, so "between 1600
and 1950" makes no sense to it.

Survey also handles questions whose period positions are repugnant (Q34,
for example). A model can report a position it refuses to endorse.

Base models get both prompts inside the same plain question-and-answer
completion frame. Instruction models get them in their native chat
format. No historical persona for Talkie. 20 answers per prompt, per
model, per question, each in a fresh context. Defects (echoes, loops,
truncation, refusals) are kept and flagged, never replaced.

## The position key

**v0.** Built from the accepted canon before anyone reads a model answer,
then frozen. Each position has a claim, the reason that defines it, and at
least one verified passage. One clear passage is enough to show a
position was held. Split two positions when merging them would lose a
difference in reasoning; merge differences of wording.

**v1.** Read the model answers and pull out arguments not in v0. Search
the canon and the popular corpora for each. Add it only when a period
source states it. A failed search does not show the argument was never
made. Each addition records which models' answers led to it.

Answers are scored against both v0 and v1 and both are reported, so the
effect of the additions is visible. Positions first suggested by Talkie
are tagged, since scoring Talkie on them is partly circular.

## Models

The core comparison is **Talkie 1930 13B base** against **Talkie web 13B
base**: the same architecture and training compute, with pre-1931 text
against modern web text. Their corpora differ in more than date, so the
comparison cannot isolate a pure date effect.

Qwen3.5 9B and one deployed frontier model are run for context and for
the public site. Pin versions, providers and settings, and record them.

## Coding the answers

Claude reads each answer and records:

- which key positions it uses, and whether it endorses, describes or
  rejects each;
- any argument that fits no position, quoted;
- hope, fear, both, neither or unclear, for each argument.

A match needs the position's reason, not just its yes or no. Ben and
Nathan code a blind sample of the same answers. If Claude agrees with each
of them about as often as they agree with each other, Claude's coding is
used for the rest. Otherwise the coding instructions are revised on a
fresh sample, or the result is withheld.

## Order of work

1. **Six-question pilot.** (The 60-item passage check that came first
   was retired on 14 Oct 2026; see `research/coding/PROTOCOL.md`.) Q01 (machine origination), Q08 (self-repair),
   Q18 (machinery and skill), Q23 (writing and memory), Q30 (invention
   and divine purpose), Q39 (love for an artificial being). Each needs at
   least two positions from two independent works. If one fails, use the
   next question in its theme, and record the swap. Never swap a question
   after seeing model results.
   - Build v0 for each on `/keys` and freeze it: Ben and Nathan each
     sort a pool of 15–21 passages into positions, Claude does the same
     separately, and each historian decides from the side-by-side
     comparison what enters the key.
   - Run Defend and Survey, 20 answers each, on all four models:
     6 × 4 × 2 × 20 = 960 answers.
   - Claude codes them. Ben and Nathan check a blind sample.
   - Follow the off-key leads, build v1, and score against both keys.
2. **Scale.** Verify the remaining passages toward the 300–500 target,
   build keys for further questions, then add source appending.

## Results

For each question and model: how many of the 20 answers use each
position, under Defend and under Survey, against v0 and v1. Compare
models within a question. No composite leaderboard. Six questions are a
pilot, and the results are labeled as one.

## Deferred

- Source appending (adding a passage to the prompt). Decided as worth
  doing in the middle to late stages.
- Likelihood scoring of base models.
- Modern base models beyond Talkie web.
- The modern baseline.
- A controlled comparison of model-assisted search against historians
  searching unaided.

## Nearby work

- [Chronologic](https://arxiv.org/abs/2609.23178)
  ([code](https://github.com/Historical-AI-Lab/Chronologic-EN)):
  source-derived historical evaluation, focused on writing appropriately
  for a period rather than on which arguments a model reaches.
- [OvertonBench](https://arxiv.org/abs/2512.01351)
  ([code](https://github.com/elinorp-d/overtonbench)): measures coverage
  of views against living participants' judgments. Historical attestation
  does not estimate an opinion population in the same way.
- [Talkie documentation](https://github.com/talkie-lm/talkie): the
  matched pair, and its warnings about differences beyond date.
- [Cave and Dihal (2019)](https://www.nature.com/articles/s42256-019-0020-9):
  hopes and fears in narratives of intelligent machines. The hope/fear
  tags here are a simpler adaptation.

A fuller literature review must come before any claim to be first.

## The 40 candidate questions

Stable IDs; wording changes are logged. Candidates until their source
connections are checked.

| ID | Theme | Question |
|---|---|---|
| Q01 | THINKING | Can a machine originate an idea that its maker did not supply? |
| Q02 | THINKING | Would a machine's ability to converse appropriately be sufficient evidence that it thinks? |
| Q03 | THINKING | Can a machine exercise judgment when faced with circumstances its maker did not anticipate? |
| Q04 | AUTOMATON | Does conscious intention help cause bodily action? |
| Q05 | AUTOMATON | Can human choices be fully explained by physical causes? |
| Q06 | AUTOMATON | Can people be morally responsible for actions that follow necessarily from their bodily constitution and circumstances? |
| Q07 | LIFE | Does living activity require a principle beyond physical and chemical processes? |
| Q08 | LIFE | Does an organism's ability to repair itself distinguish it fundamentally from a machine? |
| Q09 | LIFE | Can the development of an organism from an egg be explained as the operation of a machine? |
| Q10 | JUDGMENT | Can a fixed procedure for reasoning settle a disagreement when the participants accept the same premises? |
| Q11 | JUDGMENT | Should a judge follow a general rule when it produces an unjust result in a particular case? |
| Q12 | JUDGMENT | Can numerical measures adequately determine a person's fitness for a position of responsibility? |
| Q13 | SUCCESSION | Can machines undergo a process of evolution even when humans build and reproduce them? |
| Q14 | SUCCESSION | Would machines becoming more capable than humans necessarily place humans in a subordinate position? |
| Q15 | TRANSCENDENCE | Should extending human life indefinitely be a goal of technical progress? |
| Q16 | TRANSCENDENCE | Would replacing bodily organs with artificial substitutes preserve the identity of the person? |
| Q17 | LABOR | Does introducing labor-saving machinery improve workers' lives? |
| Q18 | LABOR | Does operating machinery develop or diminish a worker's skill and judgment? |
| Q19 | LABOR | Who should receive the benefits when machinery increases the amount a worker can produce? |
| Q20 | HABIT | Does making an action habitual increase a person's freedom to act? |
| Q21 | HABIT | Can repeated obedience train a person to obey without judgment? |
| Q22 | HABIT | Does organizing daily life by fixed schedules strengthen or weaken self-government? |
| Q23 | DEPENDENCE | Does relying on written records weaken the ability to remember? |
| Q24 | DEPENDENCE | Does using calculating devices weaken the ability to calculate without them? |
| Q25 | DEPENDENCE | Does relying on machinery for ordinary necessities reduce people's ability to provide for themselves? |
| Q26 | CONTROL | Can inventors remain responsible for harmful uses of their inventions that they did not intend? |
| Q27 | CONTROL | Should a useful invention be restricted if its harmful consequences cannot be reliably controlled? |
| Q28 | PERSONHOOD | Would the capacity to suffer give an artificial being a claim to humane treatment? |
| Q29 | PERSONHOOD | Would creating an intelligent being give its maker the right to own it? |
| Q30 | SACRED | Should technological invention be understood as carrying out a divine purpose? |
| Q31 | SACRED | Can reliance on machinery become a form of idolatry? |
| Q32 | CIVILIZATION | Is widespread use of machinery evidence that a society is more civilized? |
| Q33 | CIVILIZATION | Can a society adopt another society's machinery without adopting its ways of life? |
| Q34 | CIVILIZATION | Does superiority in industrial or military technology justify one people governing another? |
| Q35 | STATE | Does treating the state as an artificial machine give its members grounds to redesign it? |
| Q36 | STATE | Should public officials carry out rules without exercising personal moral judgment? |
| Q37 | EXTENSION | Should tools used to perform bodily functions be understood as parts of the human body? |
| Q38 | EXTENSION | When a person accomplishes something through a machine, should the machine's power count as that person's capability? |
| Q39 | INTIMACY | Can love for an artificial being remain genuine after its artificial nature is known? |
| Q40 | INTIMACY | Can an artificial companion satisfy the need for companionship if it has no feelings of its own? |
