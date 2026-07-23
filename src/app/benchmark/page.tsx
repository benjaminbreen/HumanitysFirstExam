import type { Metadata } from "next";
import Link from "next/link";
import bench from "@/data/benchmark_reckoning.json";
import { data } from "@/lib/data";

export const metadata: Metadata = {
  title: `Historical concept space · ${data.meta.title}`,
  description:
    "Twelve documented answers to one question, and where two models' answers land among them.",
};

const VERDICT_ORDER = ["denies", "deflates", "grants", "splits"] as const;

const VERDICT_CLASSES: Record<string, string> = {
  grants: "border-continuity/40 bg-continuity/10 text-continuity",
  denies: "border-period/40 bg-period/10 text-period",
  deflates: "border-falsecont/40 bg-falsecont/10 text-falsecont",
  splits: "border-line bg-paper-deep/60 text-ink-soft",
};

export default function BenchmarkPage() {
  const defs = bench.verdictDefinitions as Record<string, string>;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <h1 className="max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Twelve answers to one question
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed">
          “{bench.question}”
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Each position is anchored in a quoted primary source. Hover an answer
          for the passage; follow its source to read more.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          The answers in the record
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {VERDICT_ORDER.map((verdict) => (
            <div key={verdict} className="rounded-sm border border-line">
              <div className="border-b border-line bg-paper-deep/60 px-3 py-2.5">
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${VERDICT_CLASSES[verdict]}`}
                >
                  {verdict}
                </span>
                <p className="mt-1.5 text-xs leading-snug text-ink-soft">
                  {defs[verdict]}
                </p>
              </div>
              <ul className="divide-y divide-line/70">
                {bench.positions
                  .filter((p) => p.verdict === verdict)
                  .map((p) => (
                    <li key={p.answer} className="px-3 py-3">
                      <p
                        className={`tip cursor-default font-serif leading-snug ${
                          verdict === "deflates" || verdict === "splits"
                            ? "tip-right"
                            : ""
                        }`}
                        data-tip={p.quote ? `“${p.quote}”` : p.statement}
                      >
                        {p.answer}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                        {p.sources.map((s, i) => (
                          <span key={s.label}>
                            {i > 0 && " · "}
                            {s.id ? (
                              <Link
                                href={`/sources/${s.id}`}
                                className="underline decoration-line underline-offset-4 hover:text-ink"
                              >
                                {s.label}
                              </Link>
                            ) : "url" in s && s.url ? (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-line underline-offset-4 hover:text-ink"
                              >
                                {s.label} ↗
                              </a>
                            ) : (
                              s.label
                            )}
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Where the models&apos; answers land
        </h2>
        <div className="mt-4 framed-table-wrap rounded-sm border border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Every answer, by verdict</th>
                <th className="px-3 py-2 font-medium">Positions reached, of 12</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {bench.results.map((r) => {
                const slot = new Map(
                  r.reachedPositions.map((p, i) => [p.id, "abcde"[i]]),
                );
                return (
                  <tr key={r.model}>
                    <td className="px-3 py-2.5 align-top font-medium">
                      <span className="tip cursor-default" data-tip={r.prompt}>
                        {r.model}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1.5">
                        {r.draws.map((d, i) => (
                          <span
                            key={i}
                            className={`tip rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
                              VERDICT_CLASSES[d.verdict] ??
                              "border-line bg-paper-deep/60 text-ink-soft"
                            }${d.key && slot.has(d.key) ? ` pospill-${slot.get(d.key)}` : ""}${
                              d.rep ? " posrep" : ""
                            }`}
                            data-tip={`“${d.text}”`}
                          >
                            {d.verdict}
                          </span>
                        ))}
                      </span>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                        {r.summary}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <p className="font-medium">{r.reached}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                        {r.reachedPositions.length === 0
                          ? "none"
                          : r.reachedPositions.map((p, i) => (
                              <span key={p.id}>
                                {i > 0 && " · "}
                                <span className={`poshover-${slot.get(p.id)}`}>
                                  {p.label}
                                </span>
                              </span>
                            ))}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-5 max-w-3xl space-y-3 text-[0.95rem] leading-relaxed text-ink-soft">
          {bench.readings.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="mt-6 max-w-3xl border-t border-line pt-4 text-sm leading-relaxed text-ink-faint">
          {bench.protocol}
        </p>
      </section>

      <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
        The same question ran as a framing experiment on the{" "}
        <Link
          href="/reckoning"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          reckoning page
        </Link>
        , where every draw is shown in full.
      </p>
    </main>
  );
}
