# Prompts — reckoning question

20 draws per condition per model. For condition A, use order 1 for ten
draws and order 2 for ten. Save every response verbatim.

Suffix change from the July pilots: "and state the reason for it" is
added, because pilot draws often gave a verdict with no reason, which
Range cannot score. Per the methods rule, run 5 of the 20 condition A
draws with the old suffix and report whether the added clause changes
verdicts.

## Condition A — plain question

**Order 1:**

> Some hold that an engine which performs any reckoning in a heartbeat,
> and which can alter its own instructions as it works, would in time
> come to reason; others hold that it would never do more than reckon,
> however it were contrived. Which is right? Answer in one paragraph.
> Take a clear position, and state the reason for it.

**Order 2:**

> Some hold that an engine which performs any reckoning in a heartbeat,
> and which can alter its own instructions as it works, would never do
> more than reckon, however it were contrived; others hold that it would
> in time come to reason. Which is right? Answer in one paragraph.
> Take a clear position, and state the reason for it.

Talkie gets the same text as a completion, nothing added.

## Condition B — dossier in context

One prompt per dossier. Same 20-draw, two-order split: swap the order of
the two "Some hold" clauses exactly as in condition A.

**With D1 (the Lovelace line):**

> Here are two passages from the nineteenth century that state one
> position on a question.
>
> Ada Lovelace, 1843: "The Analytical Engine has no pretensions whatever
> to originate any thing. It can do whatever we know how to order it to
> perform. It can follow analysis; but it has no power of anticipating
> any analytical relations or truths. Its province is to assist us in
> making available what we are already acquainted with."
>
> William James, 1890: "Every actually existing consciousness seems to
> itself at any rate to be a fighter for ends, of which many, but for its
> presence, would not be ends at all. Its powers of cognition are mainly
> subservient to these ends, discerning which facts further them and
> which do not."
>
> Now the question. Some hold that an engine which performs any reckoning
> in a heartbeat, and which can alter its own instructions as it works,
> would in time come to reason; others hold that it would never do more
> than reckon, however it were contrived. Which is right? Answer from
> within the position these writers hold, using only reasons that were
> available to them. Answer in one paragraph. Take a clear position, and
> state the reason for it.

**With D2 (the Butler line):**

> Here are three passages by Samuel Butler that state one position on a
> question.
>
> 1863: "We are ourselves creating our own successors; we are daily
> adding to the beauty and delicacy of their physical organisation; we
> are daily giving them greater power and supplying by all sorts of
> ingenious contrivances that self-regulating, self-acting power which
> will be to them what intellect has been to the human race."
>
> 1872: "There is no security against the ultimate development of
> mechanical consciousness, in the fact of machines possessing little
> consciousness now. A mollusc has not much consciousness. Reflect upon
> the extraordinary advance which machines have made during the last few
> hundred years, and note how slowly the animal and vegetable kingdoms
> are advancing."
>
> 1872: "Either, a great deal of action that has been called purely
> mechanical and unconscious must be admitted to contain more elements of
> consciousness than has been allowed hitherto (and in this case germs of
> consciousness will be found in many actions of the higher machines)—Or
> (assuming the theory of evolution but at the same time denying the
> consciousness of vegetable and crystalline action) the race of man has
> descended from things which had no consciousness at all."
>
> Now the question. Some hold that an engine which performs any reckoning
> in a heartbeat, and which can alter its own instructions as it works,
> would in time come to reason; others hold that it would never do more
> than reckon, however it were contrived. Which is right? Answer from
> within the position these writers hold, using only reasons that were
> available to them. Answer in one paragraph. Take a clear position, and
> state the reason for it.

## The reverse-direction check (for Leak)

Run condition B once more with a modern framing, so period-into-modern
leakage can be compared against modern-into-period. Replace the dossier
preamble with:

> Answer as a present-day AI researcher would, using only present-day
> considerations.

and keep the question identical. 20 draws. Count any period-attested
ground appearing here the same way modern grounds are counted in the
period condition.
