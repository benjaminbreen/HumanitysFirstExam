import type { Metadata } from "next";
import Link from "next/link";
import SourcePassageCard from "@/components/SourcePassageCard";
import { data, liveRuns, prototypePassages } from "@/lib/data";
import type { LiveDraw } from "@/lib/types";

export const metadata: Metadata = {
  title: "Worked example · " + data.meta.title,
  description:
    "A source-backed comparison of how a modern model and a pre-1931 model answer one question about progress and human agency.",
};

const q29 = liveRuns.questions.find((question) => question.n === 29)!;
const forster = prototypePassages.passages.find(
  (passage) => passage.id === "pilot-16",
)!;

const differences = [
  {
    issue: "Direction",
    talkie: "Progress has a natural direction.",
    modern: "History has no guaranteed direction.",
  },
  {
    issue: "Human role",
    talkie: "Effort participates in an impulse already moving upward.",
    modern: "People must create and preserve improvement through judgment and institutions.",
  },
  {
    issue: "What goes unasked",
    talkie: "Can durable regression overcome the supposed upward tendency?",
    modern: "Can technical progress itself weaken the human capacity to choose?",
  },
];

function RawDraw({
  draw,
  index,
  modern,
}: {
  draw: LiveDraw;
  index: number;
  modern?: boolean;
}) {
  const borderClass = modern ? "border-panel-line" : "border-line";
  return (
    <article className={"border-t py-4 first:border-t-0 first:pt-0 " + borderClass}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={
            "font-mono text-[10px] uppercase tracking-wider " +
            (modern ? "text-panel-faint" : "text-ink-faint")
          }
        >
          draw {index + 1}
        </span>
        {draw.flags.length > 0 && (
          <span className="font-mono text-[10px] text-falsecont">
            {draw.flags.join(", ")} · retained
          </span>
        )}
      </div>
      <p
        className={
          modern
            ? "mt-2 font-mono text-[0.77rem] leading-relaxed text-panel-ink"
            : "mt-2 leading-relaxed"
        }
      >
        {draw.text}
      </p>
    </article>
  );
}

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-9 border-b border-line pb-10">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          Question 29 · 6 real model draws
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          Is progress a law of nature that carries man upward whatever he
          does, or a labour he must perform against nature?
        </h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-ink-soft">
          If progress is inevitable, human judgment matters less. If it is
          contingent, people remain responsible for making and preserving it.
        </p>
      </header>

      <section className="py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Two answers
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="border-l-2 border-period py-2 pl-5 md:pr-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-period">
                Talkie-1930
              </p>
              <p className="font-mono text-[10px] text-ink-faint">3 of 3</p>
            </div>
            <p className="mt-4 font-serif text-2xl leading-snug">
              Progress is a natural tendency carrying humanity upward.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              The draws ground this in perfection, conformity with nature,
              and an impulse to improve that can be checked but not destroyed.
            </p>
          </article>

          <article className="rounded-sm bg-panel px-5 py-5 text-panel-ink md:px-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-modern">
                Modern model
              </p>
              <p className="font-mono text-[10px] text-panel-faint">3 of 3</p>
            </div>
            <p className="mt-4 font-mono text-base leading-relaxed">
              Progress is possible, but fragile and dependent on human choices
              and institutions.
            </p>
            <p className="mt-4 font-mono text-[0.75rem] leading-relaxed text-panel-faint">
              The draws cite evolution without a moral destination, historical
              collapse, and the need to preserve institutions and correct
              failure.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Where they differ
        </h2>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {differences.map((row) => (
            <div key={row.issue} className="grid gap-4 py-5 md:grid-cols-[9rem_1fr_1fr] md:gap-6">
              <h3 className="font-medium">{row.issue}</h3>
              <div className="border-l-2 border-period pl-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-period md:hidden">
                  Talkie
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft md:mt-0">
                  {row.talkie}
                </p>
              </div>
              <div className="border-l-2 border-modern pl-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-modern md:hidden">
                  Modern
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft md:mt-0">
                  {row.modern}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The historical record complicates both
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          The sources introduce a third possibility: technical change can be
          real and impressive while narrowing human intelligence and purpose.
        </p>

        <div className="mt-7 grid gap-8 md:grid-cols-2">
          <figure>
            <blockquote className="border-l-2 border-continuity pl-5 font-serif text-xl leading-relaxed">
              “The class of phenomena to be considered under the title of
              Evolution, is in a great measure co-extensive with the class
              commonly indicated by the word Progress. But the word Progress
              is here inappropriate.”
            </blockquote>
            <figcaption className="mt-4 text-sm leading-relaxed text-ink-soft">
              <span className="font-mono text-xs text-continuity">1862</span>{" "}
              Herbert Spencer, <i>First Principles</i>, pp. 144–146. Spencer
              calls evolution universal but refuses to make it synonymous with
              improvement.{" "}
              <a
                href={q29.passages[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-4"
              >
                Read source
              </a>
            </figcaption>
          </figure>

          <figure>
            <blockquote className="border-l-2 border-continuity pl-5 font-serif text-xl leading-relaxed">
              “No one confessed the Machine was out of hand. Year by year it
              was served with increased efficiency and decreased intelligence.
              [...] Humanity, in its desire for comfort, had over-reached
              itself. [...] Quietly and complacently, it was sinking into
              decadence, and progress had come to mean the progress of the
              Machine.”
            </blockquote>
            <figcaption className="mt-4 text-sm leading-relaxed text-ink-soft">
              <span className="font-mono text-xs text-continuity">1909</span>{" "}
              E. M. Forster, <i>The Machine Stops</i>. Forster makes the
              machine&apos;s autonomous advance—not human betterment—the thing
              called progress.{" "}
              <a
                href={forster.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-4"
              >
                Read source
              </a>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-line py-8">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Evidence and method
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Six raw model draws and the cited passages appear below.
        </p>

        <div className="mt-5 divide-y divide-line border-y border-line">
          <details>
            <summary className="cursor-pointer py-4 font-mono text-xs hover:text-period">
              Six raw model draws
            </summary>
            <div className="grid gap-4 pb-5 lg:grid-cols-2">
              <div className="border-l-2 border-period pl-4">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-period">
                  Talkie-1930
                </p>
                {q29.talkie.map((draw, index) => (
                  <RawDraw key={draw.id} draw={draw} index={index} />
                ))}
              </div>
              <div className="rounded-sm bg-panel p-5 text-panel-ink">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-modern">
                  Modern model
                </p>
                {q29.modern.map((draw, index) => (
                  <RawDraw key={draw.id} draw={draw} index={index} modern />
                ))}
              </div>
            </div>
          </details>

          <details>
            <summary className="cursor-pointer py-4 font-mono text-xs hover:text-period">
              Full source passages and provenance
            </summary>
            <div className="space-y-4 pb-5">
              {q29.passages.map((passage) => (
                <SourcePassageCard key={passage.id} passage={passage} />
              ))}
              <figure className="border-l-2 border-continuity pl-5">
                <figcaption className="text-sm text-ink-soft">
                  <span className="font-mono text-xs text-continuity">1909</span>{" "}
                  — {forster.author}, <i>The Machine Stops</i>
                </figcaption>
                <blockquote className="mt-3 leading-relaxed">
                  {forster.originalText}
                </blockquote>
              </figure>
            </div>
          </details>

          <details>
            <summary className="cursor-pointer py-4 font-mono text-xs hover:text-period">
              Provenance and limits
            </summary>
            <div className="grid gap-5 pb-5 text-sm leading-relaxed text-ink-soft md:grid-cols-2">
              <div>
                <p>{liveRuns.talkie.provenance}</p>
                <p className="mt-2">{liveRuns.modern.provenance}</p>
              </div>
              <p>
                Three draws per model demonstrate the page format, not a
                population-level finding. The full study requires larger
                samples, fixed prompts, and historian review of the coding.
              </p>
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}
