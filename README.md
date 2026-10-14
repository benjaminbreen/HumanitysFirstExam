# Humanity's First Exam

Positions on machines and human autonomy from 1600–1950, used as a position key
for testing language models.

A project by Benjamin Breen (UC Santa Cruz) and Nathan Davies. Funded by the
Cosmos Institute's grants on AI and human autonomy.

## Status

The first draft of the theme list (16 themes) and a seed list of 89 works are
done. One pipeline pilot has run (DEPENDENCE, Qwen and Talkie, in `trial/`);
its counts are not findings. The benchmark method is not decided.
The earlier prototype site is preserved on the `prototype` branch.

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
