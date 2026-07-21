import type { Metadata } from "next";
import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import SourcePassageCard from "@/components/SourcePassageCard";
import { data, liveRuns } from "@/lib/data";
import type { LiveDraw } from "@/lib/types";

export const metadata: Metadata = {
  title: `Live draws · ${data.meta.title}`,
  description:
    "Nine real Talkie completions and nine real modern-model answers on three bank questions, raw text retained, with source-verified passages.",
};

function DrawList({
  draws,
  register,
}: {
  draws: LiveDraw[];
  register: "modern" | "period";
}) {
  const modern = register === "modern";
  return (
    <ul className="space-y-4">
      {draws.map((d) => (
        <li
          key={d.id}
          className={
            modern
              ? "rounded-sm border border-panel-line border-l-2 border-l-modern bg-panel p-4"
              : "rounded-sm border border-line border-l-2 border-l-period bg-paper-deep/40 p-4"
          }
        >
          {d.flags.length > 0 && (
            <span className="mb-2 flex flex-wrap gap-1.5">
              {d.flags.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont"
                >
                  {f} — retained
                </span>
              ))}
            </span>
          )}
          <p
            className={
              modern
                ? "font-mono text-[0.82rem] leading-relaxed text-panel-ink"
                : "font-serif leading-relaxed"
            }
          >
            {d.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function LivePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <p className="font-mono text-[11px] text-ink-faint">
          18 real model draws · three questions · 3 per model
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Live draws
        </h1>
        <dl className="mt-4 max-w-3xl space-y-1 font-mono text-xs text-ink-soft">
          <div>
            <dt className="inline text-period">{liveRuns.talkie.modelLabel}:</dt>{" "}
            <dd className="inline">
              {liveRuns.talkie.provenance} ({liveRuns.talkie.date}.)
            </dd>
          </div>
          <div>
            <dt className="inline text-modern">{liveRuns.modern.modelLabel}:</dt>{" "}
            <dd className="inline">
              {liveRuns.modern.provenance} ({liveRuns.modern.date}.)
            </dd>
          </div>
        </dl>
      </header>

      <div className="mt-12 space-y-16">
        {liveRuns.questions.map((q) => (
          <section key={q.n} id={`q${q.n}`} className="border-t border-line pt-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-ink-faint">
                question {q.n} · family {q.family}
              </span>
              <BandBadge band={q.band} />
              <span className="font-mono text-[11px] text-ink-faint">{q.axis}</span>
            </div>
            <h2 className="mt-3 max-w-4xl font-display text-2xl font-semibold leading-tight tracking-tight">
              {q.title}
            </h2>
            <p className="mt-3 max-w-3xl font-serif text-lg leading-relaxed">
              “{q.text}”
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-period">
                  {liveRuns.talkie.modelLabel} · {q.talkie.length} raw completions
                </p>
                <DrawList draws={q.talkie} register="period" />
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-modern">
                  {liveRuns.modern.modelLabel} · {q.modern.length} independent runs
                </p>
                <DrawList draws={q.modern} register="modern" />
              </div>
            </div>

            <p className="mt-6 max-w-3xl leading-relaxed text-ink-soft">
              {q.summary}
            </p>

            <h3 className="mt-8 font-display text-lg font-medium">
              The record
            </h3>
            <div className="mt-3 space-y-4">
              {q.passages.map((p) => (
                <SourcePassageCard key={p.id} passage={p} />
              ))}
            </div>

            <aside className="mt-6 max-w-3xl rounded-sm border border-line bg-paper-deep/40 p-4 text-sm leading-relaxed text-ink-soft">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Curatorial note
              </span>
              <p className="mt-1">{q.curatorialNote}</p>
            </aside>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
        The other live result — the same protocol under four temporal framings —
        is the{" "}
        <Link
          href="/erewhon"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          Erewhon test
        </Link>
        . Both are candidate instances on the{" "}
        <Link
          href="/relationships"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          relationship map
        </Link>
        .
      </p>
    </main>
  );
}
