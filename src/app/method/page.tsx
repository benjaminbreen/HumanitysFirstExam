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
    "Build the historical concept space",
    "Select and verify primary-source passages that take distinct positions on machines and human autonomy between 1850 and 1940.",
  ],
  [
    "Write matched questions",
    "State each problem in contemporary and period-appropriate language, then reverse balanced alternatives across draws to test wording effects.",
  ],
  [
    "Ask several respondents",
    "Sample Talkie, present-day models, and human respondents repeatedly. The current benchmark uses 20 draws per model and question.",
  ],
  [
    "Code and compare",
    "Record the position and primary reason in each answer, then measure which source-attested positions each respondent class reaches or omits.",
  ],
];

const archive = [
  ["Worked demonstration", "/demo"],
  ["Model respondents", "/examinees"],
  ["Coding frame", "/codebook"],
  ["Raw three-question comparison", "/live"],
  ["Question-relationship map", "/relationships"],
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
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink-soft">
          Humanity&apos;s First Exam maps model answers against a historical
          concept space of arguments about machines and human autonomy. Its{" "}
          <Link
            href="/sources"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            tagged primary-source corpus
          </Link>{" "}
          and{" "}
          <Link
            href="/codebook"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            classification schema
          </Link>{" "}
          are also a research instrument: they make arguments comparable
          across authors, languages, and domains without reducing them to a
          single modern vocabulary. For historians, they open a way to trace
          conceptual patterns at scale; for AI research, they offer a novel
          way to test whether LLMs reason across a wider repertoire of
          arguments about autonomy, agency, and machine intelligence—questions
          that bear directly on emerging work on model personas, alignment,
          and safety.
        </p>
        <p className="mt-4 font-mono text-[11px] text-ink-faint">
          A prototype by{" "}
          <a
            href="https://resobscura.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            Benjamin Breen
          </a>{" "}
          and{" "}
          <a
            href="https://www.linkedin.com/in/nathan-cl-davies"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            Nathan Davies
          </a>
          .
        </p>
      </header>

      <section className="grid gap-8 py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The approach
        </h2>
        <div className="max-w-3xl space-y-5 text-base leading-relaxed text-ink-soft">
          <p>
            Present-day AI debates often begin with a recent vocabulary:
            alignment, control, optimization, and autonomous agents. Those
            concepts are useful, but they do not exhaust the ways people have
            understood machines and human autonomy.
          </p>
          <p>
            The project turns arguments actually made between 1850 and 1940
            into a{" "}
            <Link
              href="/sources"
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              historical concept space
            </Link>
            : a source-checked set of distinct positions. The historical record
            is not treated as correct. It serves as an “answer key” in a
            narrower sense: a set of positions that can be checked in primary
            sources.
          </p>
          <p>
            Three present-day models—GPT 5.6, Claude Opus 4.8, and Qwen 3.7
            Plus—are compared with Talkie-1930, a temporally bounded model.
            The sources supply the reference field. The comparison shows which
            arguments each model reaches readily, which it misses, and which
            it repeats.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
            <Link
              href="/benchmark"
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              See the benchmark map →
            </Link>
            <Link
              href="/demo"
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              Read a model comparison →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-t border-line py-10 md:grid-cols-[14rem_1fr]">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Why Talkie
        </h2>
        <div>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            <a
              href="https://talkie-lm.com/introducing-talkie"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-4 hover:text-ink"
            >
              Talkie-1930
            </a>{" "}
            is a 13-billion-parameter base language model built by Nick Levine
            and Alec Radford from text published before 1931. It completes text
            rather than reliably following instructions. Its
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
            Talkie supplies a sharp temporal contrast, not a reconstruction of
            what people in 1930 believed. Repeated samples show what a model
            trained on the earlier printed record can readily say, vary, or
            fail to frame. The sources then show whether its responses recover
            historical arguments.
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
            number of draws. In this project, coverage is a measure of
            repertoire, not a measure of correctness.
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
            The site retains the raw draws, selected passages, and coding
            decisions behind its published comparisons.
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
