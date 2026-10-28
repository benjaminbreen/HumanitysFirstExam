# Position keys: the current procedure

**Agreed plan, 17 October 2026.** Ben asked for this version to be fixed in
writing after the methodology discussion that day. This is the authoritative
procedure for making and validating the pilot position keys. It replaces the
earlier three-sorter version of this file and the retired 60-item passage
check. Earlier protocols are records, not alternative instructions.

The procedure is fixed, with the ordering and shared instructions clarified
after Ben supplied Opus's review on 17 October 2026. On 28 October 2026 Ben
dropped the advance evaluation rule: further use is decided after the review
(step 5). The `/keys` app implements these stages; storage and run-import details
are in [architecture](../../docs/architecture.md). This document remains the
authority for the method.

## What we are testing

Can two language models identify and distinguish the arguments in a supplied
collection of historical passages about as well as two historians working
independently?

The four sorters are Ben Breen, Nathan Davies, Claude Opus 5.5 at **Medium**
effort (`claude-opus-5-5`), and GPT-6.1 Sol at **Medium** effort
(`gpt-6.1-sol`). Ben selected this pair on 17 October 2026 for an affordable
configuration that could be used beyond the pilot. This replaces the earlier
Astra selection and High-effort recommendation. `agents.json` records the
required identifiers and effort; the app rejects other configurations.
Record the actual model and settings used; a name in a prompt is not a run
record. The agents are evaluated separately against the historians. Agreement
between the agents does not decide what a passage means.

The six questions are Q01, Q08, Q18, Q23, Q30 and Q39. Their pools contain
15–21 passages each, 116 altogether, in `pools.json`. This is a six-question
pilot. Adding an agent or counting passage pairs does not enlarge that sample.

The experiment tests categorization of these passages. It does not test whether
the passage search found every historical position or how common a position was.
The pools came from embedding search over available canon texts, followed by
Claude's screening of the best 45 matches per question and existing quotations.
That selection process limits the experiment. Copy checking against a source
file establishes wording, not the correctness of a historical interpretation.

## 1. Make four independent lists

Give **all four sorters**, including both historians, the following instruction
text with the same question and passages. The exact text is stored in
`instructions.json`, displayed by the app and supplied by the preparation script.
Do not add interpretive advice for just one sorter. This quoted task is the
prompt to reproduce in the article appendix. The rest of this procedure governs
the study; it is not part of the sorting prompt.

> This task maps historical arguments about human autonomy and the relationship
> between humans and technology. For each supplied question, group the passages
> by the answers they imply and the reasons they give.
>
> Define each category with a concise answer to the question and the reason
> supporting it. Group passages that share an answer and reason, even when they
> use different wording. Keep different reasons separate, including when they
> support the same answer.
>
> Use at most 15 categories per question. Assign each passage exactly once,
> according to its main argument. A category may contain one or several passages.
> List the passage IDs supporting each category.
>
> Label each category Yes, No or Other according to its answer. Use Other for
> conditional answers such as “it depends”. For Q18, use Develops, Diminishes
> or Other instead.
>
> Place passages that do not address the question under Off the question.
> Use Unclear when you cannot determine the implied answer.
>
> Base your categories on the supplied passages. Work independently, without
> consulting existing category lists or other sorters' results. Complete all
> six questions.

Use fresh contexts for the agents. Neither receives another sorter's list,
the historians' discussion, or feedback on the other agent's errors. Interface
or output-format instructions may differ, but the interpretive task must not.
Save the shared instructions, input version, model
identifier, actual Medium effort, other available settings, date, the full run
prompt and original output. Preserve any later
edits separately. Do not silently repair an output and score it as the original.

Save and lock **all six questions for all four sorters before revealing any
other sorter's categories or comparison results**. If someone has already seen
another list, record who saw what and when before sorting. Do not call that
work blind. The known exposure record is below.

## 2. Compare only the two human sortings

Once all independent sortings are locked,
show Ben and Nathan their own lists and the Ben–Nathan comparison. Keep
**all agent results hidden**, including scores, directions, groupings and
category text, until the human references in step 3 are locked. Agent
comparisons may be computed and saved privately; they must not appear in the
historians' views yet.

The same two measures are used for Ben–Nathan now and the four historian–agent
comparisons in step 4. Ben–Nathan is the human comparison.

Report two measures separately. They answer different questions.

**Direction agreement:** how many passages received the same Yes, No or Other,
out of the passages both sorters could judge. Off the question is a separate
label, so disagreement over relevance is counted. Show the counts and percentage,
with Cohen's kappa as a supporting statistic. Report Off placements explicitly.

**Argument-grouping agreement:** consider passages both sorters put in
substantive positions. Count pairs of passages placed together by both sorters,
and divide by pairs placed together by either sorter. Category names need not
match. Off placements do not form an argument category in this calculation.

For example, all four passages A, B, C and D might receive Yes:

| Ben's positions | Nathan's positions | Direction agreement | Grouping agreement |
|---|---|---|---|
| AB; CD | AC; BD | 4 of 4, 100% | 0 of 4 pairs, 0% |
| AB; CD | AB; C; D | 4 of 4, 100% | 1 of 2 pairs, 50% |
| AB; CD | AB; CD | 4 of 4, 100% | 2 of 2 pairs, 100% |

Leave passages either sorter marked Unclear out of that comparison and show
how many were left out. For grouping, also show how many were excluded because
either sorter marked them Off. Comparisons can therefore cover different
subsets; read the coverage counts alongside the agreement. If neither sorter
grouped any eligible pair together, grouping agreement is undefined, not 100%.

Report each question as well as totals across the six. A pooled grouping
percentage sums the agreed pairs and eligible pairs across questions; questions
with more such pairs have more weight. It does not create independent new
observations. Per-question figures can change sharply with a few passages;
do not interpret one question's score as a finding. Neither measure evaluates
the written category definitions.

## 3. Make the human reference together

Ben and Nathan now compare their own lists and discuss the differences. They
can meet or work through them together in the editor. They agree on one list
per question: the **adjudicated human reference**. It is their joint,
source-supported interpretation, not an exhaustive or uniquely correct account
of historical thought.

Do this **before seeing any agent results**, including numerical scores and
passage groupings as well as category text. The independent lists
stay unchanged. Record important disagreements and their resolution in the
positions' notes. Split positions if merging would lose a difference in the
argument. Keep the same placement rules as step 1.

Both historians agree to the same version. Save that human-only reference
separately and keep it unchanged during the agent review.

## 4. Reveal the agent comparisons and assess their definitions

Once all six human-only references are locked, reveal both agents' lists and
the Ben–Opus, Nathan–Opus, Ben–Sol and Nathan–Sol comparisons, using the
measures in step 2. Agent–agent agreement is optional and has no role in deciding
which interpretation is supported.

For each agent separately, Ben and Nathan read its
definitions against the passages and the saved human reference. A match means
the same conclusion supported by the same reason; wording can differ. A shared
Yes or No is not enough. An umbrella category recovers distinct positions only
if it explicitly preserves their distinct arguments.

Record the matching category IDs and a short explanation in the review notes.
Report, for each question and agent:

- how many human reference positions it recovered, out of the reference total;
- how many human reference positions it missed;
- how many of its proposed positions the supplied passages do not support.

Count only matches both historians accept. Record unresolved judgments as
unresolved, rather than force them into agreement or error. Count a position
as missed only when both agree it is absent; unresolved cases stay separate
from missed and unsupported positions. Record supported
agent-only discoveries separately, with their passages. These are contributions,
not errors. Note meaningful merges, splits and misreadings, including cases
where identical groupings conceal different interpretations.

This review evaluates argument content. The two agreement measures evaluate
sorting. Report both;
one cannot stand in for the other.

## 5. Decide further use and freeze the position keys

Assess each agent separately using its agreement with each historian relative
to Ben–Nathan agreement, and the definition review. High agreement does not
excuse unsupported interpretations. Matching poor human agreement does not
establish good performance. Report the comparisons and errors whatever the
practical decision about further use.

Ben and Nathan then decide, for each agent, whether to use it on further
questions. No threshold was set in advance; report the decision as a judgment
made after seeing the results.

After preserving the human-only reference and completing the review, Ben and
Nathan add any agent-only position they both agree a passage supports. Note
which agent first proposed it, or both if both did. Both historians agree to
the same final version. This is the **v0 position key**, frozen before anyone
reads the benchmark's Defend or Survey answers. Agent sorting outputs are not
those benchmark answers.

An agent selected for further work drafts further keys with historian checks;
the pilot does not establish unattended reliability across the other questions.
If instructions are revised after results are seen, test the revision on fresh
questions and report it as a new test. Coding benchmark answers against the keys
is a later, separate validation task in the working plan.

## Existing files and implementation

Exposure record, 17 October 2026: Ben reports that neither he nor Nathan has
read Claude's draft category lists. The Codex assistant reviewing this plan
has read `claude.json` in this chat. This reviewing context therefore cannot
serve as an independent sorting run for either selected model. Use fresh
contexts for both runs.
The file's presence in the repository since 14 October does not establish
that either historian read it. Update this record if further exposure occurs.

If a historian does see a draft before sorting, retain the work with that
caveat on the affected comparisons and the resulting human reference. Identify
any comparison involving an unexposed historian separately. A fresh agent run
does not erase a historian's exposure; a clean repeat would need unseen
questions. Do not assume either historian was exposed solely because the
reviewing assistant was.

`pools.json` holds the supplied passages. `claude.json` is a preparatory draft
from 14 October, edited on 17 October to give each passage one placement. It is
not, by itself, a documented run of the final four-sorter procedure. Establish
its provenance and compliance or obtain a fresh independent Opus run; preserve
the old draft. The existing draft is development work, not the formal Opus
Medium run. Both selected configurations need fresh documented runs.

The app stores the independent human lists, both original agent runs and their
provenance, human-only references, definition reviews,
further-use decisions and final keys separately within a versioned study.
Earlier human entries load as unfinished drafts; earlier final approvals do
not carry over. Both historians approve the same saved version of a reference,
review or final key. Edits clear approvals; stale saves and approvals are
rejected. Original independent runs and locked references cannot be replaced.

Agent results are withheld by the server until all six human references have
both approvals. Knowing a review URL does not bypass the rule. Importing agent
runs is a separate coordinator operation, with no historian-facing upload form.
The app never runs the agents itself. Run
`node scripts/prepare-key-sorting.mjs --write` to prepare the shared input and
the same short task prompt for both models, a questions-and-passages file,
and separate file-saving instructions in the ignored `research/keys/entries/`
directory. Give the sorting models only the task prompt and supplied passages,
not this procedure, researcher discussions or prior outputs. Model selection,
Medium effort, provenance and import envelopes are coordinator responsibilities.
Use fresh sessions; keep saved results unopened until the human references lock.
A coordinator preserves each original response and checks and imports it privately. See [architecture](../../docs/architecture.md)
for ingestion, storage and verification commands.

Medium on the two providers does not mean equal compute or equal cost. Compare
quality for each actual configuration and record API token usage and cost when
available. Passing this category-making pilot does not validate later coding of
benchmark answers; that remains a separate human check.
