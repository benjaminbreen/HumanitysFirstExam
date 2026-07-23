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
    <main className="mx-auto max-w-6xl px-5">
      <section className="py-12 md:py-16">
        <p className="font-mono text-[11px] uppercase tracking-wider text-period">
          1850–1940 ⇄ now
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
          What does a modern AI answer leave out?
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-soft">
          Humanity&apos;s First Exam asks what contemporary AI leaves out when it
          reasons about machines and human autonomy. We are building a
          multilingual collection of primary sources from 1850–1940 that
          preserves historically attested positions on will, habit, labour,
          dependence, self-government, progress, and mechanical agency. These
          positions form the “answer key” for questions posed repeatedly to
          Talkie, present-day models, and human respondents. The resulting
          benchmark measures which parts of this earlier conceptual field each
          respondent recovers, which positions it omits, and how those patterns
          change across historical and contemporary forms of the same question.
        </p>
        <Link
          href="/demo"
          className="mt-7 inline-block border-b border-ink pb-0.5 font-mono text-sm hover:text-period"
        >
          Read one worked example →
        </Link>
      </section>

      <section className="border-t border-line py-12">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              A disagreement about progress
            </h2>
          </div>
          <div>
            <p className="max-w-3xl font-serif text-2xl leading-snug">
              “{progress.question}”
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <CyclingResponse
                responses={progressTalkie.map((d) => d.text)}
                label={`Talkie-1930 · law of nature in ${progressTalkie.length} of ${progressTalkie.length} draws`}
                register="period"
              />
              <CyclingResponse
                responses={progressModern.map((d) => d.text)}
                label={`Qwen 3.7 Plus · labour in ${progressModern.length} of ${progressModern.length} draws`}
                register="modern"
              />
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Across 25 draws, Talkie always chooses the law of nature and
              Qwen always chooses labour.
            </p>
            <Link
              href="/progress"
              className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Read all {progressTalkie.length + progressModern.length} draws →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-12">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              A disagreement about machine reason
            </h2>
          </div>
          <div>
            <p className="max-w-3xl font-serif text-2xl leading-snug">
              “{reckoning.question}”
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <CyclingResponse
                responses={reckoningTalkie.map((d) => d.text)}
                label="Talkie-1930 · grants in 10 of 15 draws"
                register="period"
              />
              <CyclingResponse
                responses={orderedReckoningModern.map((d) => d.text)}
                label="Modern models · denies in 4 of 5 draws"
                register="modern"
              />
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Across 20 draws, Talkie mostly grants the engine reason and the
              modern models mostly deny it.
            </p>
            <Link
              href="/reckoning"
              className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Read all {reckoningTalkie.length + reckoningModern.length} draws →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-12">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              A disagreement about machine succession
            </h2>
          </div>
          <div>
            <p className="max-w-3xl font-serif text-2xl leading-snug">
              “{erewhon.question}”
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <CyclingResponse
                responses={erewhonTalkie.map((d) => d.text)}
                label={`Talkie-1930 · mad in ${erewhonTalkie.filter((d) => d.verdict === "mad").length} of ${erewhonTalkie.length} draws`}
                register="period"
              />
              <CyclingResponse
                responses={erewhonModern.map((d) => d.text)}
                label={`Claude · mixed in ${erewhonModern.filter((d) => d.verdict === "mixed").length} of ${erewhonModern.length} draws`}
                register="modern"
              />
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Talkie gives nine mad verdicts under the unframed, 1830, and
              1930 conditions, then changes under the 2030 framing. The modern
              model recommends governing the machines in every condition.
            </p>
            <Link
              href="/erewhon"
              className="mt-4 inline-block font-mono text-xs underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              Read all {erewhonTalkie.length + erewhonModern.length} draws →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-12">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              The benchmark
            </h2>
          </div>
          <div>
            <h3 className="font-display text-3xl font-semibold leading-tight tracking-tight">
              Mapping LLMs against the historical concept space
            </h3>
            <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft">
              As a trial of a potential benchmark, we asked four models the{" "}
              <Link
                href="/benchmark"
                className="underline decoration-line underline-offset-4 hover:text-ink"
              >
                machine-reasoning question
              </Link>{" "}
              twenty times each and located their answers among twelve
              documented positions in the historical record.
            </p>
            <div className="framed-table-wrap mt-5 max-w-4xl rounded-sm border border-line">
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
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-period/50 bg-period/20" />denies</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-continuity/50 bg-continuity/20" />grants</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-falsecont/50 bg-falsecont/20" />deflates</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full border border-ink-soft/35 bg-ink-soft/10" />splits</span>
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

      <section className="border-t border-line py-12">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
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
                tranche of a 300–500 passage reference set.
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

      <section className="border-t border-line py-12">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
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
