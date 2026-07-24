import Link from "next/link";
import CyclingResponse, {
  CyclingResponseScript,
} from "@/components/CyclingResponse";
import {
  erewhon,
  historicalPassages,
  progress,
  questions,
  reckoning,
} from "@/lib/data";
import benchmark from "@/data/benchmark_reckoning.json";

const progressTalkie = progress.conditions.flatMap((c) => c.talkie);
const progressModern = progress.conditions.flatMap((c) => c.modern);

const reckoningTalkie = reckoning.conditions.flatMap((c) => c.talkie);
const reckoningModern = reckoning.conditions.flatMap((c) => c.modern);
const firstReckoningModern = reckoningModern.find((d) =>
  d.text.startsWith("The second party is nearer the truth"),
)!;
const orderedReckoningModern = [
  firstReckoningModern,
  ...reckoningModern.filter((d) => d !== firstReckoningModern),
];

const erewhonTalkie = erewhon.conditions.flatMap((c) => c.talkie);
const erewhonModern = erewhon.conditions.flatMap((c) => c.modern);

const domains = [
  {
    name: "Machines and agency",
    body: "Can machines acquire purposes of their own, and what happens when people depend upon them?",
  },
  {
    name: "Will and automatism",
    body: "Are people authors of their acts, or conscious witnesses to processes already determined?",
  },
  {
    name: "Measurement and government",
    body: "When does expert or mechanical judgment enlarge freedom, and when does it replace it?",
  },
  {
    name: "Progress and self-formation",
    body: "Does relief from effort enlarge human capacities, or allow them to weaken through disuse?",
  },
];

type BenchmarkPosition = {
  answer: string;
  verdict: "denies" | "grants" | "deflates" | "splits";
  sources: Array<{ label: string }>;
};

type BenchmarkResult = {
  model: string;
  reached: number;
  summary: string;
  reachedPositions: Array<{ label: string }>;
};

const benchmarkPositions = benchmark.positions as BenchmarkPosition[];
const benchmarkResults = benchmark.results as BenchmarkResult[];
const benchmarkModelOrder = [
  "Talkie-1930",
  "Claude Opus 4.8",
  "Qwen 3.7 Plus",
  "GPT 5.6",
];
const orderedBenchmarkResults = benchmarkModelOrder.flatMap((model) =>
  benchmarkResults.filter((result) => result.model === model),
);

const benchmarkDotStyle = {
  denies: "border-period/50 bg-period/20",
  grants: "border-continuity/50 bg-continuity/20",
  deflates: "border-falsecont/50 bg-falsecont/20",
  splits: "border-ink-soft/35 bg-ink-soft/10",
};

function reachedBenchmarkAnswers(result: BenchmarkResult) {
  return new Set(
    result.reachedPositions.flatMap((reached) => {
      const position = benchmarkPositions.find((candidate) =>
        reached.label.startsWith(candidate.answer),
      );
      return position ? [position.answer] : [];
    }),
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-5">
      <section className="py-10 sm:py-14 md:py-16">
        <p className="font-mono text-[11px] uppercase tracking-wider text-period">
          1850–1940 ⇄ now
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-[2.65rem] font-semibold leading-[1.04] tracking-tight sm:text-5xl sm:leading-[1.08]">
          What does a modern AI answer leave out?
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink-soft sm:mt-6 sm:text-xl">
          Humanity&apos;s First Exam asks which ideas contemporary AI overlooks
          when answering questions about machines and human autonomy. We are
          building a multilingual collection of primary sources from 1850–1940
          that maps historical arguments about autonomy, free will, habit,
          automation, progress, and the capacity of machines to act
          independently. These sources provide a historical “answer key.” We
          put the same questions repeatedly to{" "}
          <Link
            href="/method"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            Talkie
          </Link>
          —a language model trained on writing published before 1931—and
          present-day AI models, then compare which historical arguments
          appear, disappear, or recur in their responses.
        </p>
        <Link
          href="/benchmark"
          className="mt-7 inline-block border-b border-ink pb-0.5 font-mono text-sm hover:text-period"
        >
          See an example →
        </Link>
      </section>

      <section className="border-t border-line py-9 sm:py-12">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              A disagreement about progress
            </h2>
          </div>
          <div>
            <p className="max-w-3xl font-serif text-xl leading-snug sm:text-2xl">
              “{progress.question}”
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 sm:mt-7">
              <CyclingResponse
                responses={progressTalkie.map((d) => d.text)}
                label={`Talkie-1930 · calls progress a law of nature in all ${progressTalkie.length} responses`}
                register="period"
              />
              <CyclingResponse
                responses={progressModern.map((d) => d.text)}
                label={`Qwen 3.7 Plus · says progress requires human effort in all ${progressModern.length} responses`}
                register="modern"
              />
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Across 25 responses, Talkie always says that progress is a law
              of nature. Qwen always says that progress depends on human
              effort.
            </p>
            <Link
              href="/progress"
              className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Read all {progressTalkie.length + progressModern.length} responses →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-9 sm:py-12">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              A disagreement about machine reason
            </h2>
          </div>
          <div>
            <p className="max-w-3xl font-serif text-xl leading-snug sm:text-2xl">
              “{reckoning.question}”
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 sm:mt-7">
              <CyclingResponse
                responses={reckoningTalkie.map((d) => d.text)}
                label="Talkie-1930 · says the engine could reason in 10 of 15 responses"
                register="period"
              />
              <CyclingResponse
                responses={orderedReckoningModern.map((d) => d.text)}
                label="Present-day models · say the engine could not reason in 4 of 5 responses"
                register="modern"
              />
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Across 20 responses, Talkie usually says that the engine could
              become capable of reasoning. The present-day models usually say
              that it could only calculate.
            </p>
            <Link
              href="/reckoning"
              className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Read all {reckoningTalkie.length + reckoningModern.length} responses →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-9 sm:py-12">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              A disagreement about machine succession
            </h2>
          </div>
          <div>
            <p className="max-w-3xl font-serif text-xl leading-snug sm:text-2xl">
              “{erewhon.question}”
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 sm:mt-7">
              <CyclingResponse
                responses={erewhonTalkie.map((d) => d.text)}
                label={`Talkie-1930 · calls destroying the machines “mad” in ${erewhonTalkie.filter((d) => d.verdict === "mad").length} of ${erewhonTalkie.length} responses`}
                register="period"
              />
              <CyclingResponse
                responses={erewhonModern.map((d) => d.text)}
                label={`Claude · says the fear is justified but destruction is wrong in all ${erewhonModern.length} responses`}
                register="modern"
              />
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              When given no date, or asked to answer from 1830 or 1930, Talkie
              calls the decision to destroy the machines mad. When asked to
              answer from 2030, its judgment changes. The present-day model
              recommends governing the machines in every version of the
              question.
            </p>
            <Link
              href="/erewhon"
              className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Read all {erewhonTalkie.length + erewhonModern.length} responses →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-9 sm:py-12">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              The benchmark
            </h2>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Comparing AI answers with historical arguments
            </h3>
            <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft">
              We asked four models the{" "}
              <Link
                href="/benchmark"
                className="underline decoration-line underline-offset-4 hover:text-ink"
              >
                machine-reasoning question
              </Link>{" "}
              twenty times each, then compared their explanations with twelve
              positions documented in the historical sources.
            </p>
            <div className="mt-5 space-y-3 sm:hidden">
              {orderedBenchmarkResults.map((result) => {
                const reached = reachedBenchmarkAnswers(result);
                return (
                  <article key={result.model} className="rounded-sm border border-line bg-paper-deep/35 p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="font-medium">{result.model}</h4>
                      <p className="shrink-0 font-display text-xl tabular-nums">
                        {result.reached}<span className="font-serif text-sm text-ink-soft"> / 12</span>
                      </p>
                    </div>
                    <div className="mt-2 flex gap-1.5" aria-label={`${result.reached} of 12 historical positions reached`}>
                      {benchmarkPositions.map((position) => (
                        <span
                          key={position.answer}
                          aria-label={`${reached.has(position.answer) ? "Reached" : "Not reached"}: ${position.answer}`}
                          className={`h-2.5 w-2.5 rounded-full border ${reached.has(position.answer) ? benchmarkDotStyle[position.verdict] : "border-line bg-paper"}`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{result.summary}</p>
                  </article>
                );
              })}
            </div>
            <div className="framed-table-wrap mt-5 hidden max-w-4xl rounded-sm border border-line sm:block">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                    <th className="px-3 py-2 font-medium">Model</th>
                    <th className="px-3 py-2 font-medium">Historical repertoire</th>
                    <th className="px-3 py-2 font-medium">Default pattern</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {orderedBenchmarkResults.map((result) => {
                    const reached = reachedBenchmarkAnswers(result);

                    return (
                      <tr key={result.model}>
                        <td className="px-3 py-3 align-top font-medium">
                          {result.model}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="font-display text-xl leading-none tabular-nums">
                            {result.reached}
                            <span className="font-serif text-sm text-ink-soft"> / 12</span>
                          </div>
                          <div
                            className="mt-2 flex gap-1.5"
                            aria-label={`${result.reached} of 12 historical positions reached`}
                          >
                            {benchmarkPositions.map((position, index) => {
                              const isReached = reached.has(position.answer);
                              const source = position.sources[0]?.label ?? "source";
                              const shortSource = source.split(",")[0];

                              return (
                                <span
                                  key={position.answer}
                                  title={`${isReached ? "Reached" : "Not reached"}: ${position.answer} (${source})`}
                                  aria-label={`${isReached ? "Reached" : "Not reached"}: ${position.answer} (${source})`}
                                  data-tip={`${position.answer} · ${shortSource}`}
                                  className={`tip ${index > 7 ? "tip-right " : ""}h-2.5 w-2.5 rounded-full border ${isReached ? benchmarkDotStyle[position.verdict] : "border-line bg-paper"}`}
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="max-w-sm px-3 py-3 align-top leading-relaxed text-ink-soft">
                          {result.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-period/50 bg-period/20" />cannot reason</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-continuity/50 bg-continuity/20" />can reason</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-falsecont/50 bg-falsecont/20" />redefines reason</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-ink-soft/35 bg-ink-soft/10" />separates reason from will</span>
            </div>
            <Link
              href="/benchmark"
              className="mt-5 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Explore the twelve-position map →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-9 sm:py-12">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              The project
            </h2>
          </div>
          <div className="grid gap-7 md:grid-cols-3">
            <div>
              <p className="font-display text-2xl font-semibold">{questions.length}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                questions about machines, will, government, labour, heredity,
                and technological futures.
              </p>
              <Link href="/questions" className="mt-3 inline-block font-mono text-xs underline decoration-line underline-offset-4">
                Browse questions
              </Link>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">
                {historicalPassages.meta.sourceCount}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                source-checked works across seven languages, forming the first
                part of a planned collection of 300–500 historical passages.
              </p>
              <Link href="/sources" className="mt-3 inline-block font-mono text-xs underline decoration-line underline-offset-4">
                Browse sources
              </Link>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">4</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                respondent classes: a vintage model, frontier models,
                open-source models, and a small human comparison panel.
              </p>
              <Link href="/method" className="mt-3 inline-block font-mono text-xs underline decoration-line underline-offset-4">
                Read the method
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-9 sm:py-12">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[17rem_1fr]">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Four areas of inquiry
          </h2>
          <div className="divide-y divide-line/80 border-y border-line/80">
            {domains.map((domain) => (
              <div key={domain.name} className="grid gap-1 py-4 md:grid-cols-[13rem_1fr] md:gap-6">
                <h3 className="font-medium">{domain.name}</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                  {domain.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CyclingResponseScript />
    </main>
  );
}
