# Building the position keys: procedure

Set by Ben Breen, 17 October 2026. Replaces the retired 60-item passage
check (`research/coding/PROTOCOL.md`). Pages: `/keys`. Code:
`src/lib/keys.ts`, `src/app/keys/`.

## Purpose

Two things, for each of the six pilot questions (Q01, Q08, Q18, Q23, Q30,
Q39):

1. Build the list of positions that readers of the site see and that model
   answers are later matched against.
2. Test whether Claude sorts sources into positions closely enough to how
   Ben and Nathan sort them that Claude can sort the other 34 questions.

## Passages

Each question has a pool of 15 to 21 passages (`research/keys/pools.json`).
The full texts of the 204 canon works were ranked by similarity to the
question text; Claude read the best 45 (at most two per work) plus the
quotations already found for the question, and kept those that discuss the
question, whatever answer they give. Every passage is checked word for word
against its source text.

## Step 1. Sort, separately

Ben, Nathan and Claude each sort the same pool, without seeing each other's
lists.

- A position has an implied answer (what the passages imply about our
  question, in our words), the argument the text gives for it, and a
  direction: Yes, No or Other (Q18: Develops, Diminishes, Other). "Yes,
  because x" and "yes, because y" are two positions, both under Yes. "It
  depends" goes under Other.
- At most 15 positions per question.
- Each passage goes in exactly one place: the position it supports most
  directly, Off the question, or Unclear.
- A sorter is finished when every passage is placed and every position has
  a direction.

Claude's lists are in `research/keys/claude.json`, written on 14 October
2026 before either historian sorted. On 17 October the 15 passages Claude
had put in two or three positions were each given the one position they
support most directly.

## Step 2. Measure agreement

When Ben and Nathan have both finished a question, all three lists lock and
`/keys/<q>/agreement` opens. For each pair of sorters (Ben and Nathan, Ben
and Claude, Nathan and Claude):

- **Grouped together.** Of the pairs of passages that either sorter put in
  the same position, how many both did. This needs no decision about which
  of one sorter's positions matches which of the other's.
- **Same direction.** How many passages both gave the same direction (Off
  the question counts as its own answer), with Cohen's kappa.
- Passages either sorter marked Unclear are left out of that pair, and the
  number left out is shown.

`/keys` shows the same figures added up over every question both
historians have finished.

**The test.** Across the six questions, Claude passes if its agreement with
each historian is about as high as the historians' agreement with each
other. Six questions are about 120 passages: a pass is evidence, not proof,
and is reported as a pilot result.

## Step 3. Make the final list

On `/keys/<q>/final`, Ben and Nathan merge their two lists into one. They
can start from either list. Claude's list is not a source for this step, so
the test above stays independent of it.

- Settle each difference together and record how in the position's note.
- Where they disagree on whether two positions are one, split them if
  merging would lose a difference in the argument.
- Then check Claude's list for positions neither had. Add one only if both
  agree a passage states it, noted "first proposed by Claude".
- Same rules as step 1: at most 15 positions, one place per passage.

Any edit clears both agreements. The list freezes when Ben and Nathan have
both agreed to the same version. It is frozen before anyone reads a model
answer. This is the list the site shows.

## Step 4. After the pilot

If Claude passed, it sorts the other 34 questions the same way, and Ben and
Nathan check one or two of them by steps 1 to 3. If not, Claude's sorting
instructions are revised and tested on a question it has not seen.

Model answers are matched against the frozen lists later; that coding is
checked separately (Claude codes, Ben and Nathan code a blind sample).

## Storage

Sortings and final lists are saved to Upstash Redis (`keys:ben`,
`keys:nathan`, `keys:final`) on the site, or to `research/keys/entries/`
locally (not committed).
