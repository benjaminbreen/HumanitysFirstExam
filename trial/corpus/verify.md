# Verification instructions — tethering test

Each item has an **answer** (written by a language model, to the question
"Does relying on machines weaken human capacities?") and up to 8 **candidate
passages** from historical texts, found by similarity search.

For each item:

1. State the answer's position in under 15 words: its verdict (weakens /
   does not weaken / depends / none) and the main reason it gives. If it
   gives no reason, say so.
2. For each candidate, decide whether the passage makes **the same
   argument**: the same claim about machines, tools, or mechanization and
   human capacities, resting on the same reason. Same topic is not enough.
   The passage need not answer the same question in the same words, and may
   be about tools, labour, habit, or machinery generally.
   - `same`: the passage makes this argument, for this reason.
   - `related`: the passage makes a neighbouring argument (same concern,
     different reason, or the same reason applied to something else).
   - `no`: otherwise.
3. For `same` or `related`, copy the sentence from the passage that makes
   the argument, verbatim.

Be strict about `same`. A passage that merely mentions machines, or argues
the opposite, is `no`.

Output a JSON array, one object per item, in input order:

```json
{"aid": "…", "position": "…",
 "matches": [{"cid": "c1", "match": "same | related | no", "quote": "…"}]}
```

List every candidate in `matches`, including the `no`s (quote empty).
