import type { Metadata } from "next";
import Link from "next/link";
import { data, relationshipMap, relationships } from "@/lib/data";
import type { MapPair } from "@/lib/types";

export const metadata: Metadata = {
  title: `The relationship map · ${data.meta.title}`,
  description:
    "Twelve source-linked modern AI questions paired with questions from the historical bank.",
};

const TYPE_STYLE: Record<string, string> = {
  "found-in-both": "border-continuity/40 bg-continuity/10 text-continuity",
  "mostly-period": "border-period/40 bg-period/10 text-period",
  "mostly-modern": "border-modern/40 bg-modern/10 text-modern",
  "false-friend": "border-falsecont/40 bg-falsecont/10 text-falsecont",
};

const TYPE_ORDER = ["found-in-both", "false-friend", "mostly-modern", "mostly-period"];

function TypeChip({ type }: { type: string }) {
  const t = relationships.types.find((x) => x.id === type);
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${TYPE_STYLE[type] ?? TYPE_STYLE["mostly-modern"]}`}
    >
      {t?.label ?? type}
    </span>
  );
}

function PairCard({ pair }: { pair: MapPair }) {
  return (
    <article className="rounded-sm border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <TypeChip type={pair.type} />
        <span className="font-mono text-[11px] text-ink-faint">
          {pair.modernId}
          {pair.periodN != null && <> ↔ Q{pair.periodN} ({pair.periodFamily})</>}
          {" · "}
          {pair.agreed ? "raters agreed" : "adjudicated"}
        </span>
        {pair.modernId === "M009" && (
          <Link
            href="/persona"
            className="font-mono text-[11px] text-continuity underline decoration-continuity/40 underline-offset-4"
          >
            real draws →
          </Link>
        )}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="border-l-2 border-l-modern pl-3">
          <p className="font-mono text-[0.8rem] leading-relaxed text-ink">
            {pair.modernText}
          </p>
          {pair.sourceTitle && (
            <p className="mt-1 font-mono text-[11px] text-ink-faint">
              {pair.sourceUrl ? (
                <a
                  href={pair.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-2 hover:text-ink-soft"
                >
                  {pair.sourceTitle}
                </a>
              ) : (
                pair.sourceTitle
              )}
            </p>
          )}
        </div>
        <div className="border-l-2 border-l-period pl-3">
          {pair.periodText ? (
            <p className="font-serif leading-relaxed">{pair.periodText}</p>
          ) : (
            <p className="text-sm italic text-ink-faint">
              no defensible period counterpart
            </p>
          )}
        </div>
      </div>
      {pair.explanation && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {pair.explanation}
        </p>
      )}
    </article>
  );
}

export default function RelationshipsPage() {
  const sorted = [...relationshipMap.pairs].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <p className="font-mono text-[11px] text-ink-faint">12-question map</p>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          The relationship map
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">
          {relationships.premise}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          The four types
        </h2>
        <div className="mt-4 space-y-4">
          {relationships.types.map((t) => (
            <div key={t.id} className="grid gap-x-4 gap-y-1 md:grid-cols-[13rem_1fr]">
              <span>
                <TypeChip type={t.id} />
              </span>
              <p className="text-sm leading-relaxed text-ink-soft">
                {t.definition}{" "}
                {t.instance && (
                  <Link
                    href={t.instance.href}
                    className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                  >
                    {t.instance.label} →
                  </Link>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Question pairs
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Each modern question links to its source text. Embedding similarity
          supplied candidate matches from the historical bank; two raters
          classified each pair and adjudicated disagreements.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Families A/C1 draw from historical sources. Families B/C2 restate
          modern scenarios in period vocabulary.
        </p>
        <div className="mt-6 space-y-4">
          {sorted.map((p) => (
            <PairCard key={p.modernId} pair={p} />
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Method
        </h2>
        <ol className="mt-6">
          {relationships.pipeline.map((step, i) => (
            <li
              key={step.name}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-l border-line pb-6 last:pb-0"
            >
              <span className="-ml-px flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-paper font-mono text-sm text-ink-soft">
                {i + 1}
              </span>
              <div className="-mt-1">
                <h3 className="font-display text-lg font-medium">{step.name}</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
