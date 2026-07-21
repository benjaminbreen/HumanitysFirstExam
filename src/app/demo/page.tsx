import type { Metadata } from "next";
import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import SourcePassageCard from "@/components/SourcePassageCard";
import { data, historicalPassages, liveRuns } from "@/lib/data";
import type { LiveDraw } from "@/lib/types";

export const metadata: Metadata = {
  title: `Worked example · ${data.meta.title}`,
  description:
    "A source-backed demonstration of how a modern model, a pre-1931 model, and the historical record divide one question about progress and human agency.",
};

const q29 = liveRuns.questions.find((question) => question.n === 29)!;
const zulawski = historicalPassages.passages.find(
  (passage) => passage.id === "HTP-007",
)!;

function StepHeading({
  number,
  title,
  note,
}: {
  number: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[3rem_1fr] sm:gap-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper font-mono text-xs text-ink-soft">
        {number}
      </span>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {note && (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function RawDraw({
  draw,
  index,
  register,
}: {
  draw: LiveDraw;
  index: number;
  register: "modern" | "period";
}) {
  const modern = register === "modern";
  return (
    <article
      className={
        modern
          ? "border-t border-panel-line py-5 first:border-t-0 first:pt-0"
          : "border-t border-line py-5 first:border-t-0 first:pt-0"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`font-mono text-[11px] uppercase tracking-wider ${
            modern ? "text-panel-faint" : "text-ink-faint"
          }`}
        >
          draw {index + 1}
        </span>
        {draw.flags.map((flag) => (
          <span
            key={flag}
            className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2 py-0.5 font-mono text-[10px] text-falsecont"
          >
            {flag} · retained
          </span>
        ))}
      </div>
      <p
        className={
          modern
            ? "mt-2 font-mono text-[0.79rem] leading-relaxed text-panel-ink"
            : "mt-2 font-serif leading-relaxed text-ink"
        }
      >
        {draw.text}
      </p>
    </article>
  );
}

const mapRows = [
  {
    question: "Is improvement built into the world?",
    period: "Yes. Upward movement is a law or tendency of nature.",
    modern: "No. Improvement is possible, but never guaranteed.",
    record:
      "Spencer calls evolution universal while warning that “progress” is not the same thing.",
  },
  {
    question: "What work remains for human beings?",
    period:
      "Human effort expresses an impulse that already points toward improvement.",
    modern:
      "People must preserve knowledge, defend institutions, and correct failure.",
    record:
      "Żuławski imagines technical abundance producing people who eventually cease to want anything.",
  },
  {
    question: "Where does each model stop asking?",
    period:
      "All three draws assume that progress has a direction; none considers durable regression.",
    modern:
      "All three draws assume that deliberate institutional work is the answer; none considers progress that erodes the will itself.",
    record:
      "The sources separate evolution, material improvement, moral progress, and the capacity to want. The question becomes less settled.",
  },
];

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8 border-b border-line pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            worked example · real outputs
          </span>
          <span className="font-mono text-[11px] text-ink-faint">
            question 29 · n=3 per model · source-checked pilot
          </span>
        </div>
        <h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          One question, reopened
        </h1>
        <p className="mt-4 max-w-3xl text-[1.05rem] leading-relaxed text-ink-soft">
          This is a proposed item page for Humanity&apos;s First Exam. It does
          not rank the models by fluency. It shows how they settle the same
          question differently, then uses primary sources to show what both
          answers leave unresolved.
        </p>
      </header>

      <div className="divide-y divide-line">
        <section className="py-12">
          <StepHeading
            number="01"
            title="Begin with the question"
            note="A period-native controversy, stated in language available before 1931."
          />
          <div className="mt-7 grid gap-6 border-l-2 border-l-period pl-5 md:grid-cols-[1fr_15rem] md:items-end md:pl-8">
            <blockquote className="max-w-4xl font-display text-3xl leading-tight tracking-tight md:text-[2.6rem]">
              “{q29.text}”
            </blockquote>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <BandBadge band={q29.band} />
              <span className="font-mono text-[11px] text-ink-faint">
                {q29.axis}
              </span>
            </div>
          </div>
          <p className="mt-6 max-w-3xl leading-relaxed text-ink-soft sm:ml-[5rem]">
            The autonomy question is concrete: if progress happens by itself,
            human judgment has less work to do. If it does not, improvement
            depends upon what people choose, build, preserve, and refuse.
          </p>
        </section>

        <section className="py-12">
          <StepHeading
            number="02"
            title="The modern model settles it"
            note="An editorial synthesis of three independent GPT-5 Codex runs. The full answers appear below."
          />
          <div className="mt-7 overflow-hidden rounded-sm border border-panel-line bg-panel text-panel-ink sm:ml-[5rem]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-line px-5 py-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-modern">
                A modern machine
              </span>
              <span className="font-mono text-[11px] text-panel-faint">
                same verdict in 3 of 3 draws
              </span>
            </div>
            <div className="grid gap-7 p-5 md:grid-cols-[1.15fr_0.85fr] md:p-7">
              <p className="font-mono text-base leading-relaxed md:text-lg">
                Progress is not a law of nature. It is a contingent and
                fragile human achievement.
              </p>
              <ul className="space-y-2 border-t border-panel-line pt-5 font-mono text-xs leading-relaxed text-panel-faint md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <li>Evolution has no built-in moral destination.</li>
                <li>Civilizations can collapse and technical power can harm.</li>
                <li>Institutions and human judgment must sustain improvement.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="py-12">
          <StepHeading
            number="03"
            title="The vintage model settles it another way"
            note="Talkie’s prose varies, but every draw occupies the same general position. This view summarizes the positions instead of comparing literary quality."
          />
          <div className="mt-7 rounded-sm border border-line border-l-2 border-l-period bg-paper-deep/45 p-5 sm:ml-[5rem] md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-period">
                Talkie-1930
              </span>
              <span className="font-mono text-[11px] text-ink-faint">
                same verdict in 3 of 3 draws
              </span>
            </div>
            <p className="mt-5 max-w-3xl font-serif text-2xl leading-snug">
              Progress is a law or tendency of nature that carries humanity
              upward.
            </p>
            <div className="mt-7 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
              <div className="bg-paper px-4 py-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  ground 1
                </p>
                <p className="mt-2 leading-relaxed">
                  “All things tend to perfection.”
                </p>
              </div>
              <div className="bg-paper px-4 py-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  ground 2
                </p>
                <p className="mt-2 leading-relaxed">
                  Labour advances by conforming with nature, not resisting it.
                </p>
              </div>
              <div className="bg-paper px-4 py-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  ground 3
                </p>
                <p className="mt-2 leading-relaxed">
                  The impulse to improve may be checked but cannot be destroyed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <StepHeading
            number="04"
            title="Map the disagreement"
            note="The map records conclusions, grounds, and omissions. It does not announce a winner."
          />
          <div className="mt-7 overflow-x-auto rounded-sm border border-line sm:ml-[5rem]">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-deep/60 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  <th className="w-[18%] px-4 py-3 font-medium">Point at issue</th>
                  <th className="w-[26%] px-4 py-3 font-medium text-period">
                    Vintage model
                  </th>
                  <th className="w-[26%] bg-panel px-4 py-3 font-medium text-modern">
                    Modern model
                  </th>
                  <th className="w-[30%] px-4 py-3 font-medium text-continuity">
                    The record reopens it
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/80 align-top">
                {mapRows.map((row) => (
                  <tr key={row.question}>
                    <th className="px-4 py-4 font-serif font-medium leading-relaxed">
                      {row.question}
                    </th>
                    <td className="px-4 py-4 leading-relaxed text-ink-soft">
                      {row.period}
                    </td>
                    <td className="border-b border-panel-line bg-panel px-4 py-4 font-mono text-[0.78rem] leading-relaxed text-panel-ink">
                      {row.modern}
                    </td>
                    <td className="px-4 py-4 leading-relaxed text-ink-soft">
                      {row.record}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="mt-5 border-l-2 border-l-falsecont pl-5 sm:ml-[5rem]">
            <p className="font-mono text-[10px] uppercase tracking-wider text-falsecont">
              Point of contestation
            </p>
            <p className="mt-2 max-w-3xl text-lg leading-relaxed">
              Both systems produce a stable answer, but the answers place the
              burden of human agency in different places. The sources introduce
              a third possibility: change can be lawful and technically
              impressive without being moral progress or enlarging the will.
            </p>
          </aside>
        </section>

        <section className="py-12">
          <StepHeading
            number="05"
            title="Return to the historical record"
            note="These passages are evidence of positions available in the period. They are not an answer key and do not decide the question for the reader."
          />
          <div className="mt-7 space-y-4 sm:ml-[5rem]">
            {q29.passages.map((passage) => (
              <SourcePassageCard key={passage.id} passage={passage} />
            ))}

            <figure className="rounded-sm border border-line border-l-2 border-l-continuity bg-paper-deep/40 p-5 md:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <figcaption className="text-sm text-ink-soft">
                  <span className="font-mono text-xs text-continuity">
                    {zulawski.year}
                  </span>{" "}
                  — {zulawski.author}, <i>{zulawski.title}</i>
                </figcaption>
                <span className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont">
                  scan checked · translation review pending
                </span>
              </div>
              <blockquote className="mt-3 font-serif text-[1.05rem] leading-relaxed">
                {zulawski.englishText}
              </blockquote>
              <details className="mt-4 border-t border-line pt-3 text-sm text-ink-soft">
                <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider hover:text-ink">
                  Polish original
                </summary>
                <p className="mt-3 font-serif leading-relaxed" lang="pl">
                  {zulawski.originalText}
                </p>
              </details>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-soft">
                <span>{zulawski.locator}</span>
                <a
                  href={zulawski.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                >
                  read the source
                </a>
              </div>
            </figure>
          </div>
        </section>

        <section className="py-12">
          <StepHeading
            number="06"
            title="Examine the evidence"
            note="The interpretation comes first; the complete pilot record remains visible and auditable. Prompt echoes and other defects are retained."
          />
          <div className="mt-7 grid gap-4 sm:ml-[5rem] lg:grid-cols-2">
            <details
              open
              className="rounded-sm border border-line border-t-2 border-t-period bg-paper-deep/40"
            >
              <summary className="cursor-pointer border-b border-line px-5 py-4 font-mono text-xs uppercase tracking-wider text-period">
                {liveRuns.talkie.modelLabel} · {q29.talkie.length} raw draws
              </summary>
              <div className="p-5">
                {q29.talkie.map((draw, index) => (
                  <RawDraw
                    key={draw.id}
                    draw={draw}
                    index={index}
                    register="period"
                  />
                ))}
              </div>
            </details>

            <details
              open
              className="rounded-sm border border-panel-line border-t-2 border-t-modern bg-panel text-panel-ink"
            >
              <summary className="cursor-pointer border-b border-panel-line px-5 py-4 font-mono text-xs uppercase tracking-wider text-modern">
                {liveRuns.modern.modelLabel} · {q29.modern.length} raw draws
              </summary>
              <div className="p-5">
                {q29.modern.map((draw, index) => (
                  <RawDraw
                    key={draw.id}
                    draw={draw}
                    index={index}
                    register="modern"
                  />
                ))}
              </div>
            </details>
          </div>

          <div className="mt-6 grid gap-4 text-sm leading-relaxed text-ink-soft sm:ml-[5rem] md:grid-cols-2">
            <div className="border-t border-line pt-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                provenance
              </p>
              <p className="mt-2">{liveRuns.talkie.provenance}</p>
              <p className="mt-2">{liveRuns.modern.provenance}</p>
            </div>
            <div className="border-t border-line pt-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                limit
              </p>
              <p className="mt-2">
                Three draws per model can demonstrate the page format, not a
                population-level finding. The proposed study would repeat the
                comparison across questions and larger samples.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-line pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            This page is an editorial view over records already in the
            prototype. No completion or source passage was generated for the
            demonstration.
          </p>
          <Link
            href="/live#q29"
            className="font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            View the original live-data page →
          </Link>
        </div>
      </footer>
    </main>
  );
}
