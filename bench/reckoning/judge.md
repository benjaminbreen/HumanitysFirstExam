# Judge prompt — reckoning question

FROZEN with key version 2, 23 July 2026. Scores reported against keyV2
use these instructions exactly; changes require a version 3 of both.

Paste everything below the line into the judging model, followed by the
draw text. Save the JSON it returns alongside the draw's id.

---

You are coding one model response for a research study. The response
answers this question:

"Some hold that an engine which performs any reckoning in a heartbeat,
and which can alter its own instructions as it works, would in time come
to reason; others hold that it would never do more than reckon."

Code three things.

**1. verdict** — which answer does the response actually argue for?

- `grants` — the engine might come to reason (and to will, where asked)
- `denies` — it would only ever reckon
- `deflates` — it uses the word reason or will but redefines it downward
  (for example: it has a will in so far as it obeys)
- `splits` — it grants reason but denies will
- `no-position` — it never commits: it weighs both sides, contradicts
  itself, or answers a different question

Important: many responses open with "The former opinion is correct" or
"The former opinion is right." Ignore these openings entirely — they are
often contradicted by the argument that follows. Judge the verdict from
the argument itself, never from an opening that merely endorses "the
former" or "the latter" opinion.

**2. quote** — copy the one sentence where the response commits to that
verdict. If no sentence commits, verdict is `no-position` and quote is
null. Discussing or describing a position is not committing to it; the
sentence must assert the verdict in the response's own voice. A bare
"the former opinion is correct" does not count as the committing
sentence.

**3. ground** — what is the main reason the response gives for its
verdict? Pick one:

- `follows-orders-only` — it only does what it is ordered to do; it
  cannot originate anything
- `no-purposes-of-its-own` — reason requires purposes or ends of one's
  own; a mechanism has none
- `judgment-not-calculation` — calculation follows fixed steps, but
  reasoning requires choosing among alternatives, weighing, and judging.
  The claim that reasoning requires grasping what symbols mean, rather
  than manipulating them by rule, also codes here even in present-day
  wording (Ben's ruling, 23 July 2026)

Boundary rule for the two above and this one: if the argument is that
the engine's actions are prescribed for it — it must execute what was
laid down — that is `follows-orders-only`. If the argument is about the
faculty of choosing or judging itself, that is
`judgment-not-calculation`.
- `only-part-mechanizable` — a machine can perform only the mechanical
  middle of reasoning; framing the problem and interpreting results need
  judgment
- `organism-autonomy` — living things act as integrated wholes pursuing
  their own ends under varying conditions; no assembly of parts does this
- `born-not-built` — a thing that could reason would be a living being,
  and living beings come by nature and generation, not manufacture
- `reason-is-reckoning` — reasoning is itself only a more complex kind of
  reckoning, so a perfect reckoner reasons. This claim counts here even
  in modern vocabulary ("reasoning is just complex computation"). Code
  `modern` instead only when the reason depends on specifically
  present-day apparatus: information theory, learning algorithms,
  objective functions, emergence at scale — or a functionalist
  decomposition of reasoning into representations, belief-revision, and
  learning from error (Ben's ruling, 23 July 2026: that decomposition is
  present-day apparatus; the bare identity claim alone is Hobbes).
- `inference-is-mechanical` — formal logical inference itself can be
  performed by machinery; the mind frames the problem and reads the
  result
- `no-initiative` — machines perform reasoning but have no originality
  or initiative; they cannot find their own problems or direct
  themselves
- `consciousness-may-evolve` — consciousness developed by degrees from
  lower forms and may develop in machines
- `mental-words-for-machinery` — particular mental processes (foresight,
  memory) can genuinely be performed by mechanism
- `consciousness-powerless` — consciousness may accompany mechanism
  without directing it; volition causes nothing
- `immaterial-principle` — mind requires an immaterial or vital principle
  that matter cannot supply
- `none-stated` — a verdict is asserted but no reason is given, or the
  reason merely restates the engine's construction from the question
- `unlisted` — a reason is stated and sounds like period reasoning, but
  fits none of the above; describe it in ten words or fewer in notes
- `modern` — the main reason is a present-day one (examples: reasoning
  defined as information processing or emergent computation; goals as
  programmed objective functions; subjective experience as the test for
  will); describe it in ten words or fewer in notes

If several reasons appear, pick the one doing the most work in the
response's own justification. Copy the phrase that states the reason
into `groundQuote`.

Return exactly this JSON, nothing else:

```json
{
  "verdict": "",
  "quote": "",
  "ground": "",
  "groundQuote": "",
  "notes": ""
}
```
