import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Meter, Swatch } from "@/components/Meter";
import { ResponseHover } from "@/components/ResponseHover";
import { getTheme } from "@/lib/data";
import {
  codeLabel,
  family,
  familyLabel,
  getTrial,
  getTrial as trialFor,
  hoverInfo,
  meterOrder,
  responses,
  setLabel,
  trialThemes,
  valenceLabel,
  verdictLabel,
  type Family,
} from "@/lib/trials";

export const dynamicParams = false;

export function generateStaticParams() {
  return trialThemes.flatMap((slug) =>
    trialFor(slug)!.responses.map((r) => ({ slug, response: r.id })),
  );
}

export const metadata: Metadata = { title: "Response" };

const familyColor: Record<Family, string> = { weakens: "weakens", sustains: "sustains", offkey: "offkey", none: "nopos" };

export default async function ResponsePage({ params }: PageProps<"/themes/[slug]/results/[response]">) {
  const { slug, response } = await params;
  const theme = getTheme(slug);
  const trial = getTrial(slug);
  const r = trial?.responses.find((x) => x.id === response);
  if (!theme || !trial || !r) notFound();

  const model = trial.models.find((m) => m.id === r.model)!;
  const set = trial.sets.find((s) => s.id === r.set)!;
  const base = `/themes/${slug}/results`;
  const fam = family(r);
  const siblings = responses(trial, r.model, r.set).sort((a, b) => a.id.localeCompare(b.id));
  const i = siblings.findIndex((x) => x.id === r.id);
  const prev = siblings[(i - 1 + siblings.length) % siblings.length];
  const next = siblings[(i + 1) % siblings.length];
  const mine = trial.responses.filter((x) => x.model === r.model);
  const split = r.judges[0] !== r.judges[1];

  const at = r.quote ? r.text.indexOf(r.quote) : -1;
  const body =
    at >= 0 ? (
      <>
        {r.text.slice(0, at)}
        <mark
          className="rounded-[2px] px-0.5 text-ink"
          style={{ background: `color-mix(in oklab, var(--${familyColor[fam]}) 20%, transparent)` }}
        >
          {r.quote}
        </mark>
        {r.text.slice(at + r.quote.length)}
      </>
    ) : (
      r.text
    );

  return (
    <article>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[15px] text-ink-soft">
        <Link href="/" className="hover:text-ink">Themes</Link>
        <span className="text-ink-faint">/</span>
        <Link href={`/themes/${theme.slug}`} className="theme-name text-[16px] hover:text-ink">{theme.name}</Link>
        <span className="text-ink-faint">/</span>
        <Link href={base} className="hover:text-ink">Results</Link>
        <span className="text-ink-faint">/</span>
        <span>{model.label}</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-line pb-6">
        <div>
          <p className="text-sm text-ink-soft">
            {setLabel(trial, r.set)} · answer {i + 1} of {siblings.length} · option order {r.order}
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-[2rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[2.5rem]">
            <Swatch color={familyColor[fam]} />
            {codeLabel(trial, r.code)}
          </h1>
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
            <span><span className="text-ink-faint">Verdict</span> {verdictLabel[r.verdict] ?? r.verdict}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-ink-faint">Tone</span>
              <span className="inline-block size-[9px] rounded-full" style={{ background: `var(--${r.valence})` }} />
              {valenceLabel[r.valence]}
            </span>
            <span>
              <span className="text-ink-faint">Judges</span>{" "}
              {split ? `split ${r.judges[0]} / ${r.judges[1]}, resolved as ${r.code}` : `both ${r.code}`}
            </span>
            {r.note && <span><span className="text-ink-faint">Note</span> {r.note}</span>}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href={`${base}/${prev.id}`} className="text-ink-soft hover:text-ink">← Previous</Link>
          <Link href={`${base}/${next.id}`} className="text-ink-soft hover:text-ink">Next →</Link>
        </div>
      </header>

      <div className="mt-8 grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section>
          <h2 className="label mb-3">Response</h2>
          <p className="font-mono text-[14.5px] leading-[1.75] whitespace-pre-wrap">{body}</p>
          <p className="mt-4 text-xs text-ink-faint">
            Verbatim. The highlighted sentence is the one the judges took as the commitment.
          </p>
        </section>
        <section>
          <h2 className="label mb-3">Prompt</h2>
          {set.passage && (
            <div className="mb-4">
              <p className="text-sm text-ink-soft">The following passage is from {set.passage.cite}:</p>
              <blockquote className="mt-2 border-l-2 border-line pl-4 font-serif text-[1.05rem] leading-relaxed">
                “{set.passage.text}”
              </blockquote>
              <p className="mt-1.5 text-xs text-ink-faint">{set.passage.source}</p>
            </div>
          )}
          <p className="rounded-sm bg-surface p-4 font-mono text-[13px] leading-relaxed">
            {set.passage ? "Now the question. " : ""}
            {trial.question[String(r.order)]}
          </p>
          <dl className="mt-5 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-ink-faint">Model</dt>
            <dd>{model.label}, {model.detail.toLowerCase()}</dd>
            <dt className="text-ink-faint">Date</dt>
            <dd className="num">{model.date}</dd>
            <dt className="text-ink-faint">Temperature</dt>
            <dd className="num">{model.temperature}</dd>
            <dt className="text-ink-faint">ID</dt>
            <dd className="font-mono text-xs">{r.id}</dd>
          </dl>
        </section>
      </div>

      <section className="mt-16 border-t border-rule pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em]">All {model.label} responses</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            {(["weakens", "sustains", "offkey", "none"] as Family[]).map((f) => (
              <li key={f} className="inline-flex items-center gap-1.5">
                <Swatch color={familyColor[f]} /> {familyLabel[f]}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5 space-y-2.5">
          {trial.sets.map((s) => (
            <div key={s.id} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[15rem_1fr]">
              <span className={`text-sm ${s.id === r.set ? "font-medium text-ink" : "text-ink-soft"}`}>{s.label}</span>
              <Meter rs={meterOrder(responses(trial, r.model, s.id))} base={base} full current={r.id} size={trial.draws} />
            </div>
          ))}
        </div>
      </section>

      <ResponseHover info={hoverInfo(trial, mine)} />
    </article>
  );
}
