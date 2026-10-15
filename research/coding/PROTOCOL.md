Blind passage check

Status: approved by Nathan Davies, 14 October 2026 (reported by Ben).
Drafted by Claude, 29 September 2026, rewritten 13 October 2026.

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
research/coding/sample.json. On 14 October 2026 the 8 drawn items with
no quotation were replaced by 8 stances with quotations from the same
questions (i61 to i68), so every item has a quotation.

Amendment, 14 October 2026 (Ben; Nathan had not started coding). OCR
errors made some quotations hard to read, so the quotations shown are
corrected before Nathan codes. Two fixes are mechanical, applied by
research/coding/ocr_fix.py: line-break hyphens are rejoined, and long s
read as f is restored to s in English text. Two quotations with heavy
damage, i03 and i36, were corrected by hand by Claude from context,
without page images. 18 of the 60 quotations changed; each is labeled
on the page. The verbatim OCR text is kept in data/passages.json as
"original", and the corrections are in
research/passages/ocr-corrections.json. Ben re-checks any of the 18
items he coded before the change; his earlier answers are kept as
revisions.

Reading screen, 14 October 2026. Claude agents read every quotation in
its source context. 11 quotations were swapped for clearer passages from
the same work (research/passages/replacements.json; verbatim text kept,
cleaned text shown). 4 items whose work did not take the claimed side
were replaced by other stances on the same question (i69 to i72). Ben
re-codes any of these 15 he had already coded.

What the coder sees

One page with all 60 items, in the style of historyproblems.com/rate.
Each item shows the question, the work (author, title, year, a link to
the full text) and Claude's quotation. Claude's side and argument are
hidden.

What the coder records

One click per item: Yes, No, Other, or Doesn't take a position. Q19 is not a yes/no question:
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
  No, Other. Items either rater marked Doesn't take a position are left out of that pair, and the number left out is reported.
- The Ben–Nathan figure is the reference. The claim tested: Claude agrees
  with each historian about as often as the historians agree with each
  other.
- Doesn't take a position, counted per coder: how often Claude's
  quotation fails to state a position at all.
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
