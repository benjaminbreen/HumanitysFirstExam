# Answer-key retrieval pilot

Status: exploratory; not benchmark-ready.

The prototype embedded 100 historical questions and a capped sample of 1,200 overlapping source-text chunks. For each question it retained the ten nearest chunks. A structured-output extraction pass then coded five questions (Q8, Q57, Q70, Q59, Q64) as direct evidence, near context, or rejected retrieval noise.

## Pilot result

| Question | Direct | Near | Rejected |
|---|---:|---:|---:|
| Q8 | 0 | 7 | 2 |
| Q57 | 2 | 7 | 0 |
| Q70 | 0 | 7 | 3 |
| Q59 | 0 | 0 | 9 |
| Q64 | 0 | 3 | 6 |

This is enough to establish that embeddings can produce useful candidates, but similarity alone is permissive: most top-ranked passages share a topic without answering the question. The second-stage direct/near/rejected distinction is therefore necessary. Q57 produced two provisional direct candidates; one model-supplied quote failed exact substring verification and must not be admitted without correction. All records remain `human_decision: pending`.

## What the prototype proves

- Complete local texts can be chunked and matched against the question bank reproducibly.
- Retrieval provenance survives into review: source, chunk offsets, cosine score, excerpt, model, and source-text hash are retained.
- Structured coding can reject topical false positives and propose verdict/ground labels.
- Exact-quote validation catches at least one otherwise plausible model error.

## What it does not prove

- The 1,200-chunk cap is not representative of all 43 source records.
- The source sample is ordered rather than stratified by language, period, genre, or source.
- The extraction pass covered only five questions and sometimes returned fewer than all ten candidates.
- No model-coded passage is part of an answer key until a human verifies the excerpt, directness, verdict, and ground.
- Recall has not been measured against a hand-seeded set of known passages.

## Recommended next pass

Have two human readers review Q57 first because it is the only pilot question with provisional direct evidence. Then seed five to ten known-answer passages and measure recall@10. If retrieval misses those, improve chunking and add lexical/BM25 retrieval before spending money on a larger extraction run.

## Artifacts

- `scripts/retrieve-answer-key-candidates.mjs`
- `research/answer-key-retrieval-candidates.json`
- `scripts/extract-answer-key-candidates.mjs`
- `research/answer-key-model-coded-pilot.json`
