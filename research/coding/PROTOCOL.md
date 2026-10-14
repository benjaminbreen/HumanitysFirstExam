Blind passage check

Status: draft by Claude, 29 September 2026, rewritten 13 October 2026
after Ben chose the simpler design below. Nathan approves or amends it
before either coder starts. Commit the approved version before the first
entry is saved; the commit date is the pre-registration date.

Purpose

Test whether Claude's source work can be trusted at scale. Claude
research agents chose works for each question and wrote a side and a
one-sentence argument for each (275 stances). Claude subagents then chose
a verbatim quotation for each (223 found). This check asks whether the
quotations support the sides claimed, by comparing Claude's sides with
those of two historians who have not seen them.

Sample

60 stances, drawn by trial/corpus/draw_sample.py with seed 1931 from the
249 stances whose work has a downloaded text. The draw goes round-robin
across the 40 questions, so every question appears at least once. Item
ids (i01 to i60) are in random order. The sample file is
research/coding/sample.json; it is not redrawn. 52 of the 60 have a
quotation; for the other 8 Claude found none.

What the coder sees

One page with all 60 items, in the style of historyproblems.com/rate.
Each item shows the question, the work (author, title, year, a link to
the full text) and Claude's quotation. Claude's side and argument are
hidden. Where Claude found no quotation, the item says so, and the coder
answers from knowledge of the work or marks Can't tell.

What the coder records

One click per item: Yes, No, Other, or Doesn't take a position (Can't
tell for the 8 items without a quotation). Q19 is not a yes/no question:
Other or Doesn't take a position only. An optional note. Each click is
saved at once, under the coder's name.

Rules

- Ben and Nathan code independently and do not discuss items until both
  have finished all 60.
- The 60 sampled stances are held back on the site's public pages until
  both have finished (CHECK_RUNNING in src/lib/data.ts). Every other
  stance is visible.
- An entry can be revised before the comparison opens; every earlier
  version is kept with its time.
- The comparison opens only when both have coded every item.

Measures

- Side agreement for each pair (Ben–Nathan, Ben–Claude, Nathan–Claude),
  reported as counts ("agreed on 47 of 52") and Cohen's kappa over Yes,
  No, Other. Items either rater marked Doesn't take a position or Can't
  tell are left out of that pair, and the number left out is reported.
- The Ben–Nathan figure is the reference. The claim tested: Claude agrees
  with each historian about as often as the historians agree with each
  other.
- Doesn't take a position, counted per coder: how often Claude's
  quotation fails to state a position at all.
- The 8 items without a quotation are reported separately.
- "Other" answers agree only as a category; their content is compared by
  reading the notes.

Afterwards

Ben and Nathan settle disagreements together and record each decision.
The settled entries become the first verified passages. The remaining
stances are verified in a separate, non-blind pass.

Limits

- This checks the passages Claude found, not what Claude missed. Missing
  works and positions are a separate job.
- Claude chose each quotation knowing the side it claimed, so the passage
  may lead the coder toward that side. The check measures whether the
  passage supports a side, not what the whole work argues.
- The sample is of stances with downloaded texts; copyrighted and
  unfetched works are not represented.
