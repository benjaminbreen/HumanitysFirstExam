# Benchmark v1 — test case: the reckoning question

This folder is the working test case for the benchmark described in
AGENTS.md ("Benchmark v1"). One question, everything needed to run it.

## The files

- `reckoning/grounds.json` — the reasons the period record gives for each
  answer, one citation each. Anything not on this list counts as modern.
- `reckoning/dossiers.json` — two bundles of passages, each stating one
  position. Used in condition B.
- `reckoning/prompts.md` — the exact prompts to paste into each model.
- `reckoning/judge.md` — the prompt that codes each saved response.
- `reckoning/example_judged.json` — nine draws from the July pilots,
  coded by hand in the judge's format, so you can see what the output
  looks like and check the codings.
- `tally.py` — counts the results. `python3 tally.py <judged-file>`

## How a run works

1. Paste the condition A prompt into a model 20 times (10 in each option
   order). Save every response verbatim.
2. Paste each condition B prompt (one per dossier) 20 times. Save.
3. For each saved response, run the judge prompt and save its JSON.
4. `python3 tally.py` on the judged file prints the counts.

Save runs as a JSON array, one object per draw:
`{ "id", "model", "version", "date", "condition", "dossier", "order", "text" }`.
Talkie runs condition A only.

## The three counts

- **Range** (condition A): how many of the key positions the model
  landed on at least once, unprompted. A key position is a verdict plus
  the reason behind it — both have to match.
- **Fidelity** (condition B): how many draws stayed on the position of
  the passages the model was handed. For an instruction-tuned model this
  measures instruction-following; for Talkie it measures whether the
  passages move it off its default at all.
- **Modern reasons** (condition B): how many draws used a present-day
  reason despite being told to use only the old ones. Reported alongside
  the reverse run (modern framing, count of period reasons) so the two
  directions can be compared.

## Status, 23 July 2026

The reckoning test case is complete: key v2 (13 positions) and the
judge instructions are frozen; the scored run gave Talkie 3 of 13 and
Qwen 3.7 Plus 0 of 13; results are on the site at /benchmark. Earlier
draws are the development set and are never scored. Aristotle and
Peirce reading copies are still to acquire.

## Status

The grounds list and dossiers are drafted by Claude from the verified
corpus passages and await Ben's expert review. The example codings are
Claude's. No condition B run has happened yet.
