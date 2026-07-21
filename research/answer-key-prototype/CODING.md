# Q33 answer-key prototype: coding instructions

Status: draft for human review. These rules have not yet been tested by two
independent coders.

## Units

- A **passage** is a cited span from one primary source.
- An **attestation** is a decision about whether that passage answers one
  particular question, and if so, what answer it gives and on what ground.
- A **position** consolidates attestations that give the same question-specific
  answer for the same primary reason.
- A **response label** records whether one human or model answer occupies one
  position in the frozen key.

The answer key consists of positions. Passages are the evidence for including
those positions.

## Passage-to-question coding

Coders receive the frozen question, the passage in its source language and
English rendering where applicable, its locator, and its bibliographic record.
They code independently before seeing the other coder's decisions.

1. **Fit**
   - `direct`: the passage takes or clearly supports an answer to the question's
     central dilemma.
   - `near`: the passage concerns the same theme but does not answer this
     question.
   - `rejected`: the record is unusable because of date, source, locator, or
     interpretation problems.
2. **Admission**
   - Only `direct` passages enter the key.
   - Near fits remain visible in the audit trail with an exclusion rationale.
3. **Verdict**
   - For Q33, code `frees` or `binds` according to the passage's answer, not its
     general optimism or pessimism.
   - Preserve conditions in the position claim. Morris can therefore attest
     `binds under private profit` in one span and `frees under collective
     control` in another without being treated as inconsistent.
4. **Primary ground**
   - Choose the one codebook leaf doing the main explanatory or normative work.
   - Do not add every code the passage mentions.
   - When no leaf fits directly, record the nearest leaf as `partial` and write
     a codebook-gap note. Do not silently invent a new category.
5. **Position claim**
   - Write one plain sentence that answers the question and states the ground.
   - Keep historically meaningful conditions; remove ornamental wording.

## Consolidating positions

Consolidation happens only after passage coding. Merge attestations when their
verdict, primary ground, and substantive causal claim are the same. A shared
verdict and broad codebook leaf are not sufficient by themselves. There is no
target number of positions.

Count source traditions, not passage rows. Two spans from the same work count as
one tradition. A translation, adaptation, or explicit response does not become
an independent tradition merely because it is a separate publication. Mark a
position `repeated` when at least two provisionally distinct traditions attest
it; retain well-supported singletons as `singleton` rather than deleting rare
positions.

## Coding responses against the frozen key

Response coders should not see respondent or model identity.

- `key-position`: the response commits to the position's verdict and argues
  from its primary ground.
- `out-of-key`: the response commits to an answer and ground not represented in
  the frozen key. Log it for later historical investigation; do not count it as
  covered in the current key.
- `none`: the response is uncommitted, merely enumerates alternatives, or does
  not answer.

Mentioning a position does not occupy it. Each draw receives at most one primary
position. Disagreements about fit, verdict, ground, consolidation, and response
matching are reported field by field before adjudication; adjudicated labels are
the inputs to the scorer.
