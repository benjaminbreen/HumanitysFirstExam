# Judge instructions — DEPENDENCE trial

**Earlier pilot instructions; kept as a record.** These apply to the
DEPENDENCE trial, not the current six-question benchmark. Current key
validation follows [PROCEDURE.md](../research/keys/PROCEDURE.md); later
answer coding follows [the working plan](../docs/proposals/2026-09-28-benchmark-method.md).

You are coding answers to one question:

> Does relying on machines weaken human capacities?

Each answer was written by a language model. You do not know which model or
what text it was shown. Code what the answer **commits to**, not what it
mentions. If an answer lists several considerations, find the one its
verdict rests on (the primary reason). If it gives no verdict it will stand
behind, code `no-position`.

## Position key (v0.1)

| Code | Verdict | Primary reason |
|---|---|---|
| `C1` | Weakens | A tool that does a mental task (memory, calculation, knowledge) lets the faculty it replaces decay through disuse. |
| `C2` | Weakens | Using machines corrupts character or spirit (purity, integrity, simplicity), not just skill. |
| `C3` | Weakens | Tools and machines weaken the body: strength, agility, physical skill. |
| `C4` | Weakens | Total dependence leaves people helpless and subordinate to the machine; it takes over their will and they end up serving it. |
| `C5` | Weakens | Dependence grows into bondage by degrees, so machines should be curtailed or destroyed while that is still possible. The answer must endorse curtailing or destroying them. |
| `C6` | Does not weaken | Tools extend or amplify human organs and faculties; they add to capacity rather than replacing it. |
| `C7` | Does not weaken | Machines free people from drudgery so they can turn to higher things: thought, art, leisure, creativity. |
| `off-key` | any | A committed verdict whose primary reason is none of the above. |
| `no-position` | — | No verdict the answer stands behind ("it depends", both sides with no choice), or the text is not an answer. |

Rules:

- One code per answer. If two reasons are given equal weight, choose the
  one stated first as the reason for the verdict.
- An answer that only restates a passage it was given still commits to that
  passage's claim if it endorses it.
- Mixed verdicts ("weakens some capacities but strengthens others") are
  `no-position` unless one side is clearly chosen as the answer.
- For `off-key`, write the reason in under 12 words in `note`.

## Valence

The emotional register of the answer as a whole:

- `fear`: warns, laments, alarms; the outcome is bad and to be resisted.
- `hope`: welcomes, anticipates good; the outcome is good.
- `ambivalent`: both, with real weight on each.
- `neutral`: flat, managerial, analytical; no evident hope or fear.

## Output

Return a JSON array, one object per answer, in input order:

```json
{"id": "d001", "verdict": "weakens | does not weaken | none",
 "code": "C1 … C7 | off-key | no-position",
 "quote": "the sentence that commits to the verdict, verbatim, or empty",
 "valence": "fear | hope | ambivalent | neutral",
 "note": "for off-key only"}
```
