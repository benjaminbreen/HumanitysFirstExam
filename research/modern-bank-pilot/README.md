# Modern question-bank pilot

This directory is a source-anchored feasibility test for a second, modern-native
question bank. It is not yet the proposed 30–40-question production bank and it
is not a representative sample of contemporary AI or technology-policy writing.

## What was tested

- Eight purposively selected LessWrong posts published from 2019 through 2025.
- Twelve modern-register questions, each supported by a locatable source
  fragment and no more than two questions per source.
- Six provisional themes: aligned objectives, institutional control,
  collective governance, human autonomy, machine agency, and labor/purpose.
- Semantic candidate retrieval against all 100 existing period-register
  questions using OpenAI `text-embedding-3-large` and cosine similarity.
- Independent relationship ratings by two Codex subagents, followed by primary
  adjudication. Those ratings are hypotheses to freeze before model draws, not
  empirical findings about Talkie or frontier-model behavior.

The existing question bank is not a single historical-source bank. Families A
and C1 are historical-source/period-register; Families B and C2 are substantially
modern-source/period-register. The pairing output retains this distinction so a
register twin is not mistaken for evidence of historical continuity.

## Files

- `modern_questions.json`: frozen pilot sources, text checksums, provisional
  taxonomy, question wording, evidence fragments, and hand-proposed retrieval
  hints.
- `pairing_candidates.json`: the embedding run metadata, top five candidates
  for every modern question, and the best modern candidate for each of the 100
  period-register questions.
- `judged_relationships.json`: independent ratings, adjudicated labels,
  rationales, and pilot agreement statistics.
- `scripts/embed-modern-bank.mjs`: reproducible embedding and cosine-ranking
  script. It reads the ignored `.env.local` file but never logs or writes the
  API key.
- `scripts/validate-modern-bank.mjs`: offline checks for source hashes, exact
  evidence fragments, source caps, complete question coverage, and a current
  embedding-input hash.

Full downloaded post text remains in ignored `data-local/lesswrong/`. Public
artifacts contain only metadata, links, short evidence fragments, and derived
questions.

## Reproduce the embedding pass

```bash
MAX_EMBEDDING_USD=1 node scripts/embed-modern-bank.mjs
node scripts/validate-modern-bank.mjs
```

The script embeds the exact displayed text of 12 modern questions and 100
period-register questions in one request. It estimates cost before sending and
aborts if the estimate exceeds `MAX_EMBEDDING_USD`. The final July 20 run used 3,914
input tokens; under the deliberately conservative `$0.15 / million tokens`
assumption recorded in the script, estimated cost was `$0.00058710`.

OpenAI documents the embeddings endpoint, batched string inputs, and the
default 3,072 dimensions of `text-embedding-3-large` here:

- https://developers.openai.com/api/docs/guides/embeddings
- https://developers.openai.com/api/reference/resources/embeddings/methods/create

## Acceptance rules used in the pilot

A modern question is retained only when it:

1. poses one principal issue;
2. uses contemporary native vocabulary;
3. has a short, locatable supporting passage;
4. does not silently strengthen the source's certainty or normative force;
5. records whether it is a close paraphrase, synthesis, or source-grounded
   extension; and
6. remains intelligible without reading the article.

Cosine scores retrieve candidates only. They do not prove equivalence. Pairing
is many-to-many, low similarity does not by itself establish absence, and an
`uncertain` workflow status is allowed even though the published substantive
typology has four types.

## Corpus correction and next sample

The local download has 30 posts spanning 2008–2026. Its metadata stores
LessWrong `baseScore`, not citation counts. The claim “25 most-cited documents,
2007–2025” is therefore unsupported without a separate frozen manifest and
selection rule.

The next bank should stratify a broader corpus before deriving more questions:

- LessWrong / Alignment Forum arguments and disagreements;
- lab safety frameworks and model-behavior research;
- NIST, EU, UK, and other public-policy and standards documents;
- labor, creator, disability, education, and civil-rights perspectives;
- companion-system, mental-health, and human-computer-interaction research; and
- practitioner interviews as a later validation layer, with consent and a
  separate protocol.

Until those strata are added, the honest name is “maximum-variation LessWrong
pilot,” not “representative modern discourse taxonomy.”
