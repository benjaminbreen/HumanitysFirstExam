import Link from "next/link";
import { classificationSchema, codebook } from "@/lib/data";
import type {
  FramedDraw,
  FramedExperiment,
  FramedRecordEntry,
  VerdictTone,
} from "@/lib/types";

const schemaLabels = new Map(
  [
    ...classificationSchema.themes.flatMap((theme) => theme.children),
    ...codebook.flatMap((branch) => branch.leaves),
    ...classificationSchema.grounds,
    ...classificationSchema.autonomyEffects,
    ...classificationSchema.loci,
    ...classificationSchema.objects,
    ...classificationSchema.relations,
  ].map((option) => [option.id, option.label]),
);

function SchemaPill({ id, suffix }: { id: string; suffix?: string }) {
  return (
    <Link
      href={`/codebook#${id}`}
      className="rounded-md border border-ink-faint/45 px-2 py-1 font-mono text-[10px] text-ink-soft hover:border-ink-soft hover:text-ink"
    >
      {schemaLabels.get(id) ?? id}
      {suffix}
    </Link>
  );
}

const TONE_CLASSES: Record<VerdictTone, string> = {
  continuity: "border-continuity/40 bg-continuity/10 text-continuity",
  period: "border-period/40 bg-period/10 text-period",
  falsecont: "border-falsecont/40 bg-falsecont/10 text-falsecont",
  neutral: "border-line bg-paper-deep/60 text-ink-soft",
};

function VerdictChip({
  experiment,
  verdict,
  tip,
}: {
  experiment: FramedExperiment;
  verdict: string;
  /** Tooltip override; defaults to the verdict definition. */
  tip?: string;
}) {
  const meta = experiment.verdicts[verdict];
  if (!meta) return null;
  return (
    <span
      className={`tip rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${TONE_CLASSES[meta.tone]}`}
      data-tip={tip ?? meta.definition}
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
          {d.classification && (
            <p
              className={`mt-2 font-mono text-[10px] leading-relaxed ${
                modern ? "text-panel-ink/60" : "text-ink-faint"
              }`}
            >
              {[
                d.classification.claims
                  .map((c) => `${c.relation} ${c.claimId}`)
                  .join(" · "),
                d.classification.grounds.length > 0
                  ? `grounds: ${d.classification.grounds.join(", ")}`
                  : "",
                `autonomy: ${d.classification.autonomyEffect}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Period passages grouped by verdict, under the verdict table. Verdicts with
 * no passage in the corpora say so rather than disappearing.
 */
function RecordStrip({
  experiment,
  record,
}: {
  experiment: FramedExperiment;
  record: FramedRecordEntry[];
}) {
  const years = record.map((e) => e.year);
  const span = `${Math.min(...years)}–${Math.max(...years)}`;
  return (
    <div className="mt-6 border-t border-line pt-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        In the record · {span}
      </p>
      <ul className="mt-2 divide-y divide-line/70">
        {Object.keys(experiment.verdicts).map((verdict) => {
          const entries = record.filter((e) => e.verdict === verdict);
          return (
            <li key={verdict} className="flex gap-4 py-2.5">
              <span className="w-24 shrink-0 pt-0.5">
                <VerdictChip experiment={experiment} verdict={verdict} />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                {entries.length === 0 ? (
                  <p className="text-sm text-ink-faint">
                    — none yet in the corpora
                  </p>
                ) : (
                  entries.map((e) => (
                    <details key={e.id}>
                      <summary className="cursor-pointer font-serif text-sm hover:text-period">
                        {e.author}, <i>{e.work}</i> ({e.year})
                      </summary>
                      <blockquote className="mt-2 border-l-2 border-l-period/50 pl-3 font-serif text-sm leading-relaxed">
                        “{e.text}”
                      </blockquote>
                      {e.classification && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-3">
                          {e.classification.themes.map((t) => (
                            <SchemaPill key={t} id={t} />
                          ))}
                          {e.classification.claims.map((c) => (
                            <SchemaPill
                              key={c.claimId}
                              id={c.claimId}
                              suffix={` · ${schemaLabels.get(c.relation) ?? c.relation}`}
                            />
                          ))}
                          {e.classification.grounds.map((g) => (
                            <SchemaPill key={g} id={g} />
                          ))}
                          <SchemaPill id={e.classification.autonomyEffect} />
                        </div>
                      )}
                      <p className="mt-1.5 pl-3 font-mono text-[10px] text-ink-faint">
                        {[e.locator, e.note, e.source].filter(Boolean).join(" · ")}
                      </p>
                      {e.sourceId && (
                        <Link
                          href={`/sources/${e.sourceId}`}
                          className="mt-1.5 inline-block pl-3 font-mono text-[11px] underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                        >
                          Read full text →
                        </Link>
                      )}
                    </details>
                  ))
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
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
        <p className="font-mono text-[11px] text-ink-faint">{kicker}</p>
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
              {experiment.conditions.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5 font-serif">{c.label}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {c.talkie.map((d) => (
                        <VerdictChip key={d.id} experiment={experiment} verdict={d.verdict} tip={d.text} />
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {c.modern.map((d) => (
                        <VerdictChip key={d.id} experiment={experiment} verdict={d.verdict} tip={d.text} />
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
        {experiment.record && experiment.record.length > 0 && (
          <RecordStrip experiment={experiment} record={experiment.record} />
        )}
        <div className="mt-5 max-w-3xl space-y-3 text-[0.95rem] leading-relaxed text-ink-soft">
          {experiment.readings.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <details className="mt-10 border-y border-line">
        <summary className="cursor-pointer py-4 font-mono text-xs hover:text-period">
          Raw prompts and model draws
        </summary>
        <div className="space-y-12 pb-8 pt-4">
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
      </details>

      {footer && (
        <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
          {footer}
        </p>
      )}
    </main>
  );
}
