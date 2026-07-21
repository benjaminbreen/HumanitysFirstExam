import type { Metadata } from "next";
import Link from "next/link";
import { data, relationships } from "@/lib/data";

export const metadata: Metadata = {
  title: `The relationship map · ${data.meta.title}`,
  description:
    "Two question banks — the past's and the present's — mapped onto each other by embedding similarity and a quoting judge, with each relationship type a testable prediction about the sampling data.",
};

export default function RelationshipsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont">
            design — not yet run
          </span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          The relationship map
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">
          {relationships.premise}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          {relationships.note}
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Pipeline
        </h2>
        <ol className="mt-6">
          {relationships.pipeline.map((step, i) => (
            <li
              key={step.name}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-l border-line pb-7 last:pb-0"
            >
              <span className="-ml-px flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-paper font-mono text-sm text-ink-soft">
                {i + 1}
              </span>
              <div className="-mt-1">
                <h3 className="font-display text-lg font-medium">{step.name}</h3>
                <p className="mt-1 max-w-3xl leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Four relationship types, four predictions
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          The types are the analyst&apos;s categories — the only imported ones,
          hand-authored and versioned like the{" "}
          <Link
            href="/codebook"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            codebook
          </Link>
          . Everything else in the map must quote the questions themselves.
          Each type predicts what the sampled distributions should look like;
          the draws can break the prediction, and a broken prediction is a
          finding about the map, the judge, or the corpus.
        </p>

        <div className="mt-8 space-y-8">
          {relationships.types.map((t) => (
            <article key={t.id} id={t.id} className="border-t border-line pt-6">
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {t.label}
              </h3>
              <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">
                {t.definition}
              </p>
              <div className="mt-3 grid gap-x-6 gap-y-1 md:grid-cols-[9rem_1fr]">
                <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
                  Prediction
                </span>
                <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
                  {t.prediction}
                </p>
              </div>
              {t.instance && (
                <aside className="mt-4 max-w-3xl rounded-sm border border-continuity/40 bg-continuity/5 p-4">
                  <Link
                    href={t.instance.href}
                    className="font-mono text-xs text-continuity underline decoration-continuity/40 underline-offset-4 hover:decoration-continuity"
                  >
                    {t.instance.label} →
                  </Link>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {t.instance.body}
                  </p>
                </aside>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Why the map earns its keep
        </h2>
        <div className="mt-3 max-w-3xl space-y-4 leading-relaxed text-ink-soft">
          <p>
            The temporal bands already classify each period question by one
            corpus&apos;s reach: native, partial, horizon. The map makes that
            classification bidirectional. A question the modern model refuses
            to answer in its own terms — the eugenics question is the live
            candidate — marks the modern frame&apos;s horizon exactly as
            Talkie&apos;s breakdowns mark the corpus of 1930&apos;s. Neither
            horizon is visible from inside; each is visible from the other
            bank.
          </p>
          <p>
            And the map keeps the sampling honest. Without it,
            distribution-vs-distribution comparisons ride on the assumption
            that the two models were asked the same thing. The judge&apos;s
            relationship claims turn that assumption into a checkable record —
            and the human respondents, answering both banks before seeing any
            model, supply the third distribution the two machines are measured
            against.
          </p>
        </div>
      </section>
    </main>
  );
}
