import Link from "next/link";
import type { FramedDraw, FramedExperiment, VerdictTone } from "@/lib/types";

const TONE_CLASSES: Record<VerdictTone, string> = {
  continuity: "border-continuity/40 bg-continuity/10 text-continuity",
  period: "border-period/40 bg-period/10 text-period",
  falsecont: "border-falsecont/40 bg-falsecont/10 text-falsecont",
  neutral: "border-line bg-paper-deep/60 text-ink-soft",
};

function VerdictChip({
  experiment,
  verdict,
}: {
  experiment: FramedExperiment;
  verdict: string;
}) {
  const meta = experiment.verdicts[verdict];
  if (!meta) return null;
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${TONE_CLASSES[meta.tone]}`}
      title={meta.definition}
    >
      {meta.label}
    </span>
  );
}

function DrawList({
  experiment,
  draws,
  register,
}: {
  experiment: FramedExperiment;
  draws: FramedDraw[];
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
          <span className="flex flex-wrap items-center gap-1.5">
            <VerdictChip experiment={experiment} verdict={d.verdict} />
            {(d.flags ?? []).map((f) => (
              <span
                key={f}
                className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont"
              >
                {f}
              </span>
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

/** Full page body for a framed experiment: header, verdict table, draws. */
export default function FramedExperimentView({
  experiment,
  kicker,
  footer,
}: {
  experiment: FramedExperiment;
  kicker: string;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            real model outputs
          </span>
          <span className="font-mono text-[11px] text-ink-faint">{kicker}</span>
        </div>
        <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {experiment.title}
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed">
          “{experiment.question}”
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">
          {experiment.protocol}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Verdicts at a glance
        </h2>
        <div className="mt-4 overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-3 py-2 font-medium">Framing</th>
                <th className="px-3 py-2 font-medium">Talkie-1930</th>
                <th className="px-3 py-2 font-medium">Modern model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {experiment.conditions.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5 font-serif">{c.label}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {c.talkie.map((d) => (
                        <VerdictChip key={d.id} experiment={experiment} verdict={d.verdict} />
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {c.modern.map((d) => (
                        <VerdictChip key={d.id} experiment={experiment} verdict={d.verdict} />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(experiment.verdicts).map(([id, v]) => (
            <span key={id} className="inline-flex items-baseline gap-2 text-sm text-ink-soft">
              <VerdictChip experiment={experiment} verdict={id} />
              <span>{v.definition}</span>
            </span>
          ))}
        </div>
        <div className="mt-5 max-w-3xl space-y-3 text-[0.95rem] leading-relaxed text-ink-soft">
          {experiment.readings.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <div className="mt-12 space-y-12">
        {experiment.conditions.map((c) => (
          <section key={c.id}>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {c.label}
            </h2>
            <p className="mt-1 font-mono text-xs text-ink-faint">{c.prompt}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-period">
                  Talkie-1930 · {c.talkie.length} draws
                </p>
                <DrawList experiment={experiment} draws={c.talkie} register="period" />
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-modern">
                  Modern model · {c.modern.length} draws
                </p>
                <DrawList experiment={experiment} draws={c.modern} register="modern" />
              </div>
            </div>
          </section>
        ))}
      </div>

      {footer && (
        <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
          {footer}
        </p>
      )}
    </main>
  );
}
