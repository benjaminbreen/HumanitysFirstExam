import { isHeldBack, questions, stances, themes, works } from "@/lib/data";

// The dataset's state: one square per answer (work × question), by how far
// it has been checked. Categories are exclusive; held back wins.
const kinds = [
  { key: "verified", label: "verified by a historian", style: { background: "var(--verified)" } },
  { key: "quoted", label: "quotation chosen by Claude, unchecked", style: { background: "var(--provisional)" } },
  { key: "bare", label: "no quotation yet", style: { boxShadow: "inset 0 0 0 1px var(--ink-faint)" } },
  {
    key: "held",
    label: "hidden until the authors finish checking",
    style: { background: "repeating-linear-gradient(135deg, var(--ink-faint) 0 1px, transparent 1px 3px)" },
  },
] as const;

type Kind = (typeof kinds)[number]["key"];

const kindOf = (s: (typeof stances)[number]): Kind =>
  isHeldBack(s) ? "held" : s.status === "verified" ? "verified" : s.passage ? "quoted" : "bare";

export function Status() {
  const counts = Object.fromEntries(kinds.map((k) => [k.key, 0])) as Record<Kind, number>;
  for (const s of stances) counts[kindOf(s)]++;
  const squares = kinds.flatMap((k) => Array.from({ length: counts[k.key] }, () => k));
  const languages = new Set(works.map((w) => w.language)).size;

  return (
    <figure className="w-full max-w-[20rem]">
      <p className="num mb-3 font-mono text-[12px] text-ink-soft">
        {themes.length} themes · {questions.length} questions
        <br />
        {works.length} works · {languages} languages
      </p>
      <div className="grid grid-cols-[repeat(25,minmax(0,1fr))] gap-[2px]" aria-hidden>
        {squares.map((k, i) => (
          <span key={i} className="block aspect-square" style={k.style} />
        ))}
      </div>
      <figcaption className="mt-3 space-y-1 text-[13px] leading-snug">
        <p className="text-ink-soft">{stances.length} answers, one square each:</p>
        {kinds.map((k) => (
          <p key={k.key} className="flex items-baseline gap-2">
            <span className="inline-block size-2.5 shrink-0 translate-y-[1px]" style={k.style} />
            <span className="num w-7 text-right font-mono text-[12px]">{counts[k.key]}</span>
            <span>{k.label}</span>
          </p>
        ))}
      </figcaption>
    </figure>
  );
}
