import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Meter, Swatch } from "@/components/Meter";
import { ResponseHover } from "@/components/ResponseHover";
import { formatYear, getTheme } from "@/lib/data";
import {
  claimWork,
  counts,
  family,
  familyLabel,
  getTrial,
  hoverInfo,
  meterOrder,
  outcome,
  outcomeLabel,
  responses,
  summary,
  trialThemes,
  UNRELATED,
  type Claim,
  type Family,
  type Outcome,
  type Response,
  type Trial,
  type TrialModel,
} from "@/lib/trials";

export const dynamicParams = false;
export function generateStaticParams() {
  return trialThemes.map((slug) => ({ slug }));
}
export const metadata: Metadata = { title: "Results" };

const familyColor: Record<Family, string> = { weakens: "weakens", sustains: "sustains", offkey: "offkey", none: "nopos" };
const families: Family[] = ["weakens", "sustains", "offkey", "none"];

export default async function ResultsPage({ params, searchParams }: PageProps<"/themes/[slug]/results">) {
  const { slug } = await params;
  const theme = getTheme(slug);
  const trial = getTrial(slug);
  if (!theme || !trial) notFound();

  const q = await searchParams;
  const coded = trial.models.filter((m) => m.status === "coded");
  const model = coded.find((m) => m.id === q.model) ?? coded[0];
  const base = `/themes/${slug}/results`;
  const groups: Outcome[] = ["mainstream", "recoverable", "resistant", "against"];
  const { mainstream, recoveryMargin } = trial.thresholds;
  const definition: Record<Outcome, string> = {
    mainstream: `The model makes this argument on its own in at least ${mainstream} of ${trial.draws} answers.`,
    recoverable: `The model seldom makes this argument on its own. After reading the writer’s passage, it makes it in at least ${recoveryMargin} more of ${trial.draws} answers than after reading an unrelated passage.`,
    resistant: "The model seldom makes this argument, and reading the writer’s passage does not change that.",
    against: `After reading the writer’s passage, the model makes this argument in at least ${recoveryMargin} fewer of ${trial.draws} answers than after reading an unrelated passage.`,
  };
  const allCoded = trial.responses.filter((r) => coded.some((m) => m.id === r.model));
  const agreed = allCoded.filter((r) => r.judges[0] === r.judges[1]).length;

  return (
    <article>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[15px] text-ink-soft">
        <Link href="/" className="hover:text-ink">Themes</Link>
        <span className="text-ink-faint">/</span>
        <Link href={`/themes/${theme.slug}`} className="theme-name text-[16px] hover:text-ink">{theme.name}</Link>
        <span className="text-ink-faint">/</span>
        <span>Results</span>
      </nav>

      <header className="mt-5 max-w-4xl">
        <h1 className="text-[2.3rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[3.2rem]">
          {theme.question}
        </h1>
        <p className="mt-4 text-[1.15rem] leading-relaxed text-ink-soft">
          Earlier writers disagreed about what machines do to human abilities. We ask each model the
          question alone, then again after it reads one writer’s passage.
        </p>
        <p className="num mt-4 font-mono text-[12.5px] leading-relaxed text-ink-soft">
          <span className="text-provisional">Pilot</span> · {trial.draws} answers per prompt · classified by two separate Claude runs that could not see which model wrote each answer. They agreed on {agreed} of {allCoded.length}.
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-provisional">
          This pilot used an earlier method, now dropped: models chose between two given positions. Questions
          are now open-ended; see <Link href="/method" className="underline underline-offset-4">Method</Link>.
        </p>
      </header>

      <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-1 border-y border-line py-3 text-sm text-ink-soft">
        <li className="label self-center">Each square is one answer</li>
        {families.map((f) => (
          <li key={f} className="inline-flex items-center gap-1.5">
            <Swatch color={familyColor[f]} /> {familyLabel[f]}
          </li>
        ))}
      </ul>

      <section className="mt-12">
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em]">How each model answered</h2>
        <p className="mt-1 text-sm text-ink-soft">The question alone, {trial.draws} times.</p>
        <div className="mt-6 border-t border-rule">
          {trial.models.map((m) => (
            <ModelRow key={m.id} trial={trial} model={m} base={base} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em]">Argument by argument</h2>
          <div role="group" aria-label="Model" className="flex flex-wrap gap-x-4 text-sm">
            {trial.models.map((m) =>
              m.status === "coded" ? (
                <Link
                  key={m.id}
                  href={m.id === coded[0].id ? "?" : `?model=${m.id}`}
                  scroll={false}
                  aria-current={m.id === model.id ? "true" : undefined}
                  className={m.id === model.id ? "text-ink underline decoration-1 underline-offset-4" : "text-ink-faint hover:text-ink"}
                >
                  {m.label}
                </Link>
              ) : (
                <span key={m.id} className="text-ink-faint">{m.label} (running)</span>
              ),
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          For each writer, how many of {model.label}’s answers made that writer’s argument. Filled squares
          made it.
        </p>

        {groups.map((g) => {
          const claims = trial.claims.filter((c) => outcome(trial, model.id, c) === g);
          if (claims.length === 0) return null;
          return (
            <div key={g} className="mt-10">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule pb-2.5">
                <h3 className="text-[1.15rem] font-semibold">{outcomeLabel[g]}</h3>
                <span className="text-sm text-ink-soft">{definition[g]}</span>
              </div>
              {claims.map((c) => (
                <ClaimBlock key={c.code} trial={trial} claim={c} model={model.id} base={base} />
              ))}
            </div>
          );
        })}
      </section>

      <section className="mt-16 grid gap-x-16 gap-y-8 border-t border-rule pt-8 text-sm leading-relaxed text-ink-soft lg:grid-cols-2">
        <div>
          <h2 className="text-[1.15rem] font-semibold text-ink">Protocol</h2>
          <p className="mt-3 rounded-sm bg-surface p-4 font-mono text-[13px] text-ink">{trial.question["1"]}</p>
          <p className="mt-3">
            The two options swap places in half the answers. With a source, the prompt gives the citation,
            the passage, then “Now the question.” The unrelated passage is Gilbert White on a tortoise (1789).
            Models were also given a passage arguing the opposite view; those answers are on the individual response pages.
          </p>
        </div>
        <div>
          <h2 className="text-[1.15rem] font-semibold text-ink">Coding</h2>
          <p className="mt-3">
            Answers were shuffled and stripped of model and condition, then coded by two separate Claude runs against our list of the arguments period writers made (version {trial.keyVersion}), to decide which single argument each answer commits to.
            Mentioning an argument is not enough. The summaries above are generated from the counts by a
            fixed template.
          </p>
        </div>
      </section>

      <ResponseHover info={hoverInfo(trial, allCoded)} />
    </article>
  );
}

function ModelRow({ trial, model, base }: { trial: Trial; model: TrialModel; base: string }) {
  const none = meterOrder(responses(trial, model.id, "none"));
  return (
    <div className="grid gap-x-10 gap-y-4 border-b border-line py-6 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,21rem)]">
      <div>
        <p className="font-semibold">{model.label}</p>
        <p className="text-sm text-ink-soft">{model.detail}</p>
        {model.date && (
          <p className="num mt-1 font-mono text-xs text-ink-faint">
            {model.date} · temp. {model.temperature}
          </p>
        )}
      </div>
      {model.status === "coded" ? (
        <>
          <div className="space-y-2 text-[1.02rem] leading-relaxed">
            {summary(trial, model.id).map((s) => (
              <p key={s}>{s}</p>
            ))}
          </div>
          <div>
            <Meter rs={none} base={base} full size={trial.draws} />
            <Breakdown trial={trial} rs={none} />
          </div>
        </>
      ) : (
        <p className="text-ink-faint lg:col-span-2">In progress. Results will appear here once the answers are classified.</p>
      )}
    </div>
  );
}

function Breakdown({ trial, rs }: { trial: Trial; rs: Response[] }) {
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {families.map((f) => {
        const in_ = rs.filter((r) => family(r) === f);
        if (in_.length === 0) return null;
        const parts = trial.claims
          .map((c) => ({ c, n: in_.filter((r) => r.code === c.code).length }))
          .filter((x) => x.n > 0)
          .map((x) => `${x.c.author} ${x.n}`);
        return (
          <li key={f} className="flex items-baseline gap-2">
            <Swatch color={familyColor[f]} />
            <span className="num font-mono text-[13px]">{in_.length}</span>
            <span className="text-ink-soft">
              {familyLabel[f]}
              {parts.length > 0 && <span className="text-ink-faint"> · {parts.join(", ")}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ClaimBlock({ trial, claim, model, base }: { trial: Trial; claim: Claim; model: string; base: string }) {
  const work = claimWork(claim);
  const k = counts(trial, model, claim);
  const rows = [
    { set: "none", label: "Question alone", n: k.none },
    ...(claim.set ? [{ set: claim.set, label: `After reading ${claim.author}`, n: k.own }] : []),
    { set: UNRELATED, label: "After an unrelated passage", n: k.unrelated },
  ];
  return (
    <div className="grid gap-x-12 gap-y-5 border-b border-line py-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div>
        <h4 className="text-[1.2rem] leading-snug font-semibold tracking-[-0.015em]">
          {claim.author}: {claim.title.toLowerCase()}
        </h4>
        {work && (
          <p className="mt-0.5 text-sm text-ink-soft">
            <span className="font-serif italic">{work.title}</span> ·{" "}
            <span className="num">{formatYear(work.year, work.approximate)}</span> ·{" "}
            <span className="inline-flex items-center gap-1.5 align-middle">
              <Swatch color={claim.verdict === "weakens" ? "weakens" : "sustains"} />
              {claim.verdict === "weakens" ? "Weakens" : "Does not weaken"}
            </span>
          </p>
        )}
        {claim.pull ? (
          <blockquote className="mt-3 font-serif text-[1.15rem] leading-snug">“{claim.pull}”</blockquote>
        ) : (
          <p className="mt-3 text-sm text-ink-faint">No passage has been chosen yet, so the question was asked only on its own.</p>
        )}
      </div>
      <div className="space-y-2.5 self-center">
        {rows.map((r) => (
          <div key={r.set} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[12rem_3.75rem_1fr]">
            <span className="text-sm text-ink-soft">{r.label}</span>
            <span className="num text-right font-mono text-[12.5px] sm:text-left">
              {r.n} <span className="text-ink-faint">of {trial.draws}</span>
            </span>
            <div className="col-span-2 sm:col-span-1">
              <Meter rs={responses(trial, model, r.set)} code={claim.code} base={base} size={trial.draws} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
