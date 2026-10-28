# Humanity's First Exam

Positions on machines and human autonomy from 1600–1950, used as a position key
for testing language models.

A project by Benjamin Breen (UC Santa Cruz) and Nathan Davies. Funded by the
Cosmos Institute's grants on AI and human autonomy.

## Status

The working canon contains 204 distinct works. The theme list and 40 questions
remain candidates. Earlier pipeline pilots are records, not findings; the
prototype site is preserved on the `prototype` branch.

The current position-key procedure was fixed by Ben on 17 October 2026:
Ben, Nathan, Opus 5.5 (Medium) and GPT-6.1 Sol (Medium) sort passages for six
questions independently; the historians then assess the sortings and category meanings and make the
final keys. Read [the procedure](research/keys/PROCEDURE.md) for the agreed
steps and the remaining open threshold. This is the authoritative writeup for
key validation. The `/keys` app enforces the study-wide reveal order; see
[architecture](docs/architecture.md) for preparing and importing independent
agent runs. The broader benchmark plan is in
[the working plan](docs/proposals/2026-09-28-benchmark-method.md).

## Data

| File | Contents |
|---|---|
| `data/themes.json` | Themes: slug, question, summary, direction, works |
| `data/works.json` | Works: author, title, year, language, form, Wikidata IDs |
| `data/models.json` | Planned respondents |

See [docs/architecture.md](docs/architecture.md) for the data model and
routes, and [AGENTS.md](AGENTS.md) for project rules.

## Running

```bash
npm install
npm run dev
```

Next.js 16, React 19, Tailwind 4. Deployed on Vercel.
