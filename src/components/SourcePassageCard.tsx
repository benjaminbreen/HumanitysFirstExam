import CodeChip from "@/components/CodeChip";
import type { SourcePassage } from "@/lib/types";

export default function SourcePassageCard({ passage }: { passage: SourcePassage }) {
  return (
    <figure className="rounded-sm border border-line border-l-2 border-l-continuity bg-paper-deep/40 p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <figcaption className="text-sm text-ink-soft">
          <span className="font-mono text-xs text-continuity">{passage.year}</span>{" "}
          — {passage.author}, <i>{passage.title}</i>
        </figcaption>
        {passage.verified ? (
          <span
            className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity"
            title={passage.provenance ? `Checked against ${passage.provenance}` : undefined}
          >
            verified against source file
          </span>
        ) : (
          <span className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont">
            approximate — verify before citing
          </span>
        )}
      </div>
      <blockquote className="mt-3 font-serif text-[1.05rem] leading-relaxed">
        {passage.text}
      </blockquote>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span>{passage.citation}</span>
        {passage.url && (
          <a
            href={passage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            read the source
          </a>
        )}
        <span className="flex flex-wrap gap-1.5">
          {passage.codes.map((c) => (
            <CodeChip key={c} code={c} />
          ))}
        </span>
      </div>
    </figure>
  );
}
