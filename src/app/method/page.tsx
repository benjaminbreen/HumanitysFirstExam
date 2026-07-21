import type { Metadata } from "next";
import Link from "next/link";
import { data } from "@/lib/data";

export const metadata: Metadata = {
  title: `Method · ${data.meta.title}`,
  description:
    "How Humanity’s First Exam compares model positions with a historian-verified primary-source reference set.",
};

const stages = [
  [
    "Build the answer key",
    "Collect and verify primary-source passages that take distinct positions on machines and human autonomy between 1850 and 1940.",
  ],
  [
    "Write matched questions",
    "State each problem in contemporary and period-appropriate language. Use balanced choices and reverse their order across draws to measure wording effects.",
  ],
  [
    "Ask several respondents",
    "Sample Talkie, present-day models, and human respondents repeatedly. The full study uses 20 draws per question per model.",
  ],
  [
    "Code and compare",
    "Record the position and primary reason in each answer, then measure which historically attested positions each respondent class reaches or omits.",
  ],
];

const archive = [
  ["Worked demonstration", "/demo"],
  ["Model respondents", "/examinees"],
  ["Coding frame", "/codebook"],
  ["Raw three-question pilot", "/live"],
  ["Question-relationship pilot", "/relationships"],
  ["Erewhon framing test", "/erewhon"],
  ["Wording-effect test", "/reckoning"],
  ["Order-swap test", "/progress"],
  ["Completion-form test", "/subjection"],
  ["The field (ledger and grid)", "/field"],
];

export default function MethodPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8 border-b border-line pb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Method
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Humanity&apos;s First Exam measures which historically attested
          positions models recover when asked about machines and human
          autonomy.
        </p>
      </header>

      <section className="grid gap-8 py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The approach
        </h2>
        <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-ink-soft">
          <p>
            Present-day models often frame questions about technology through
            a recent vocabulary: alignment, control, optimization, and
            autonomous agents. Those concepts are useful, but they can make
            other ways of describing the problem harder to see.
          </p>
          <p>
            The project compares model responses with arguments actually made
            between 1850 and 1940. The historical record is not treated as
            correct. It serves as an answer key in a narrower sense: a set of
            positions that can be checked in primary sources.
          </p>
          <p>
            The aim is to expose the assumptions behind an AI answer. A
            present-day model, a temporally bounded model, and the historical
            record are placed side by side. The reader decides what follows.
          </p>
        </div>
      </section>

      <section className="grid gap-8 border-t border-line py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Why Talkie
        </h2>
        <div>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            Talkie-1930 is a 13-billion-parameter base language model built by
            Nick Levine and Alec Radford from text published before 1931. It
            completes text rather than reliably following instructions. Its
            cutoff falls after Darwin, Butler, James, Forster, and Čapek, but
            before Asimov&apos;s Three Laws and much of the later
            science-fiction vocabulary that shaped modern AI debate.
          </p>

          <dl className="mt-6 grid border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-line">
            <div className="py-4 sm:pr-5">
              <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Size
              </dt>
              <dd className="mt-1 font-display text-lg">13 billion parameters</dd>
            </div>
            <div className="border-t border-line py-4 sm:border-t-0 sm:px-5">
              <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Training boundary
              </dt>
              <dd className="mt-1 font-display text-lg">Before 1931</dd>
            </div>
            <div className="border-t border-line py-4 sm:border-t-0 sm:pl-5">
              <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Model type
              </dt>
              <dd className="mt-1 font-display text-lg">Base model</dd>
            </div>
          </dl>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft">
            This gives the experiment a sharp temporal contrast. Talkie is not
            a reconstruction of what people in 1930 believed. Repeated samples
            show what a model of the earlier printed record can readily say,
            vary, or fail to frame. The sources are then used to check whether
            those responses recover real historical arguments.
          </p>
          <Link
            href="/examinees"
            className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            See all respondent classes →
          </Link>
        </div>
      </section>

      <section className="border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The experiment
        </h2>
        <div className="divide-y divide-line border-y border-line">
          {stages.map(([name, body], index) => (
            <div
              key={name}
              className="grid gap-2 py-5 sm:grid-cols-[2rem_13rem_1fr] sm:gap-5"
            >
              <span className="font-mono text-xs text-ink-faint">0{index + 1}</span>
              <h3 className="font-medium">{name}</h3>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-t border-line py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What is scored
        </h2>
        <div>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            Each answer is coded for the position it takes and the main reason
            it gives. Mentioning several views without adopting one does not
            count as covering all of them. The primary measure is coverage:
            the share of eligible answer-key positions occupied across a fixed
            number of draws.
          </p>
          <p className="mt-5 border-l-2 border-period/60 pl-4 font-mono text-xs leading-relaxed text-ink-soft">
            coverage@N = distinct answer-key positions occupied ÷ eligible
            answer-key positions
          </p>
          <Link
            href="/answer-key/q33"
            className="mt-5 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            See the worked answer key →
          </Link>
        </div>
      </section>

      <section className="grid gap-8 border-t border-line py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Limits
        </h2>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
          <li>
            Talkie differs from frontier models in size, architecture,
            training period, and instruction tuning. The comparison does not
            isolate time as the sole cause of a difference.
          </li>
          <li>
            Sources from 1931–1940 belong to the historical answer key but fall
            beyond Talkie&apos;s training boundary.
          </li>
          <li>
            Source selection and coding remain historian judgments. The full
            study uses 20 draws per question per model and two independent
            raters.
          </li>
        </ul>
      </section>

      <section className="grid gap-8 border-t border-line py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Evidence archive
        </h2>
        <div>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            The pilots, raw draws, and coding decisions remain available for
            inspection.
          </p>
          <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {archive.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                >
                  {label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
