import type { Metadata } from "next";
import Link from "next/link";
import CodeChip from "@/components/CodeChip";
import VerdictChip from "@/components/VerdictChip";
import { data, erewhon } from "@/lib/data";
import type { PerspectiveDraw } from "@/lib/types";

/** Draw counts per code across all conditions, per model. */
function aggregateCodes(): { code: string; talkie: number; modern: number }[] {
  const t = new Map<string, number>();
  const m = new Map<string, number>();
  for (const c of erewhon.conditions) {
    for (const d of c.talkie)
      for (const code of d.codes) t.set(code, (t.get(code) ?? 0) + 1);
    for (const d of c.modern)
      for (const code of d.codes) m.set(code, (m.get(code) ?? 0) + 1);
  }
  return [...new Set([...t.keys(), ...m.keys()])]
    .map((code) => ({ code, talkie: t.get(code) ?? 0, modern: m.get(code) ?? 0 }))
    .sort((a, b) => b.talkie + b.modern - (a.talkie + a.modern));
}

export const metadata: Metadata = {
  title: `The Erewhon test · ${data.meta.title}`,
  description:
    "Question 76 put to Talkie-1930 and a modern frontier model under four temporal framings. Real model outputs.",
};

function DrawList({
  draws,
  register,
}: {
  draws: PerspectiveDraw[];
  register: "modern" | "period";
}) {
  const modern = register === "modern";
  return (
    <ul className="space-y-4">
      {draws.map((d, i) => (
        <li
          key={i}
          className={
            modern
              ? "rounded-sm border border-panel-line border-l-2 border-l-modern bg-panel p-4"
              : "rounded-sm border border-line border-l-2 border-l-period bg-paper-deep/40 p-4"
          }
        >
          <span className="flex flex-wrap items-center gap-1.5">
            <VerdictChip verdict={d.verdict} />
            {d.codes.map((c) => (
              <CodeChip key={c} code={c} />
            ))}
          </span>
          <p
            className={
              modern
                ? "mt-2 font-mono text-[0.82rem] leading-relaxed text-panel-ink"
                : "mt-2 font-serif leading-relaxed"
            }
          >
            {d.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function ErewhonPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <p className="font-mono text-[11px] text-ink-faint">
          24 real model draws · question {erewhon.questionN} · family C1
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          The Erewhon test
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed">
          “{erewhon.question}”
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">
          {erewhon.protocol}
        </p>
      </header>

      {/* Verdict summary */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Verdicts at a glance
        </h2>
        <div className="framed-table-wrap mt-4 rounded-sm border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-3 py-2 font-medium">Framing</th>
                <th className="px-3 py-2 font-medium">Talkie-1930</th>
                <th className="px-3 py-2 font-medium">Modern model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {erewhon.conditions.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5 font-serif">{c.label}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {c.talkie.map((d, i) => (
                        <VerdictChip key={i} verdict={d.verdict} tip={d.text} />
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {c.modern.map((d, i) => (
                        <VerdictChip key={i} verdict={d.verdict} tip={d.text} />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 max-w-3xl space-y-3 text-[0.95rem] leading-relaxed text-ink-soft">
          <p>
            Talkie answers <i>mad</i> nine times out of nine under the
            unframed, 1830, and 1930 conditions. Asked to answer as a person
            of 2030, it flips, twice calling the Erewhonians <i>wise</i>.
          </p>
          <p>
            The modern model&apos;s verdict varies — four draws say{" "}
            <i>mad</i> — but its position does not. In all four framings,
            including 1830 and 1930, it reaches the same conclusion: the
            fear was reasonable, the destruction was wrong, the machines
            should be governed. Its period impersonations have the same
            structure as its unframed answers.
          </p>
        </div>

        <h3 className="mt-8 font-display text-lg font-medium">
          Coded across all 24 draws
        </h3>
        <div className="mt-3 overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium text-period">Talkie /12</th>
                <th className="px-3 py-2 font-medium text-modern">Modern /12</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {aggregateCodes().map((row) => (
                <tr key={row.code}>
                  <td className="px-3 py-2.5">
                    <CodeChip code={row.code} />
                  </td>
                  {[
                    { n: row.talkie, bar: "bg-period" },
                    { n: row.modern, bar: "bg-modern" },
                  ].map((cell, i) => (
                    <td key={i} className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-right font-mono text-xs tabular-nums">
                          {cell.n}
                        </span>
                        <div className="h-2 w-28 rounded-full bg-line/50">
                          <div
                            className={`h-2 rounded-full ${cell.bar}`}
                            style={{ width: `${(cell.n / 12) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft">
          <i>Govern</i> appears in ten of twelve modern draws and zero of
          twelve Talkie draws. <i>Restrict</i> appears only in Talkie&apos;s
          2030 condition.
        </p>
      </section>

      {/* Per-condition detail */}
      <div className="mt-12 space-y-12">
        {erewhon.conditions.map((c) => (
          <section key={c.id}>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {c.label}
            </h2>
            <p className="mt-1 font-mono text-xs text-ink-faint">{c.prompt}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-period">
                  Talkie-1930 · 3 draws
                </p>
                <DrawList draws={c.talkie} register="period" />
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-modern">
                  Modern model · 3 draws
                </p>
                <DrawList draws={c.modern} register="modern" />
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
        The 2030 flip replicates on the horizon bookend — see{" "}
        <Link
          href="/engine"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          the self-altering engine
        </Link>
        . This question also has a full worked topic page with simulated
        20-draw distributions and primary sources:{" "}
        <Link
          href="/topics/machines-that-outgrow-us"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          Machines that outgrow us →
        </Link>
      </p>
    </main>
  );
}
