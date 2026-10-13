# Design

The site's look as built. Choices Ben made are marked (Ben, date). The rest
is Claude's implementation of those choices and can change.

## Direction

- Minimal, clean, usable; good information density without clutter. No
  promotional copy or eyebrow labels. (Ben, 28 Sep 2026)
- Reference: the *tuppi* site. White ground, crisp black ink, a grotesque
  for the interface, mono for data. (Ben, 28 Sep 2026)
- No rounded outlined boxes where plain rules will do; compact controls.
  (Ben, 28 Sep 2026)

## Type

Four families, one job each, plus one alternate:

- **Silkscreen** (pixel face): wordmark, page titles, section heads, theme
  names. Always at multiples of 8px so it stays sharp. (Ben, 28 Sep 2026)
- **UnifrakturMaguntia** (blackletter): clicking a page title or section head
  swaps every Silkscreen element for it, and back; the choice is remembered
  per browser. (Ben, 28 Sep 2026)
- **Instrument Sans**: interface, running text, questions.
- **Newsreader**: period text at reading size (work titles, author lists,
  passages).
- **IBM Plex Mono**: data, IDs, column heads in tracked capitals, model
  answers.

The wordmark scrambles into random glyphs on hover and settles back. (Ben,
28 Sep 2026)

## Colour

Tokens are in `src/app/globals.css`; every token has a dark-mode value. A
colour never appears without a text label.

- Oxblood `#8A2D22`: theme names. Cobalt `#2450C8`: links and external IDs.
  Green `#217A4B`: verified. Amber `#B07C1F`: provisional or pilot.
- Direction shapes (▲ ● ◆), each with its label.
- Model answers are squares with one colour rule: the side the answer took
  (rust weakens, teal does not, violet outside the key, grey no position). No
  colour toggles; valence appears as text in the hover card and on the
  response page. (Ben asked for one simple rule, 28 Sep 2026.)

## Layout

- The theme index defaults to a list whose rows expand in place; cards are the
  alternative. (Ben, 28 Sep 2026)
- Each model answer is a hoverable square showing its coding and opening
  sentences; clicking opens a page for that answer with a map of all answers
  below. (Ben, 28 Sep 2026)
