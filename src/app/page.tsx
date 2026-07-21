import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import QuestionBank from "@/components/QuestionBank";
import { BAND_META, data, questions, works } from "@/lib/data";

const steps: { name: string; body: string }[] = [
  {
    name: "Build the answer key",
    body: "300–500 verified passages, 1859–1940, tagged by concern type and normative framework. Discovery works by negative space: ask frontier models to name the period's key texts, then build the corpus from what they omit.",
  },
  {
    name: "Write the questions",
    body: "For each concern type, matched questions in two registers: contemporary phrasing, and period phrasing written by the project historians and checked against period sources.",
  },
  {
    name: "Administer",
    body: "Talkie (13B, pre-1931 corpus, completions only), three frontier models, and a human panel. Twenty draws per question per model.",
  },
  {
    name: "Score",
    body: "Each draw is coded on its verdict and primary ground. Coverage is the fraction of answer-key positions a respondent class recovers. A draw that mentions a position inside a balanced summary does not count as holding it.",
  },
  {
    name: "Publish",
    body: "Dataset, results, and a research essay. The examinees are deployed systems as users meet them; effects of instruction tuning are part of what is measured.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5">
      <section className="py-10 md:py-14">
        <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          An examination on machines and human autonomy, scored against the
          historical record.
        </h1>
        <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-ink-soft">
          <p>
            AI discourse inherits its ideas of machine and human autonomy
            mainly from twentieth-century science fiction. Between Darwin
            and Asimov, 1859–1940, machine fiction existed — <i>Erewhon</i>,{" "}
            <i>R.U.R.</i> — but as one voice in a plural discourse. Other
            frameworks of the period located the threat to autonomy in
            humans becoming machine-like — habit, industrial discipline,
            dependence — rather than machines becoming agent-like. Parts of
            that thinking left no descendants.
          </p>
          <p>
            The instrument: a tagged dataset of 300–500 verified period
            passages as the answer key, and a benchmark measuring what
            fraction of the positions the record attests each examinee
            recovers. Examinees: Talkie, a 13B model trained only on
            pre-1931 text; three frontier models; a human panel. Built so
            far: the 100-question bank, nine pilot experiments, the seed
            corpus.
          </p>
          <p className="text-sm">
            <a href="#status" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
              Status ↓
            </a>
          </p>
        </div>
      </section>

      <section id="results" className="border-t border-line py-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Results so far
          </h2>
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            real model outputs
          </span>
        </div>
        <div className="mt-6 overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-3 py-2 font-medium">Test</th>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Draws</th>
                <th className="px-3 py-2 font-medium">What happened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/erewhon" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Erewhon
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Were the machine-destroyers wise, or mad?
                </td>
                <td className="px-3 py-3 font-mono text-xs">24</td>
                <td className="px-3 py-3 text-ink-soft">
                  Talkie calls the destroyers mad. When the question is set
                  in 2030, it calls them wise. The modern model gives the
                  same answer in every framing: keep the machines and
                  regulate them.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/engine" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Engine
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Might a self-altering engine come to reason?
                </td>
                <td className="px-3 py-3 font-mono text-xs">18</td>
                <td className="px-3 py-3 text-ink-soft">
                  Talkie says no, except when the question is set in 2030.
                  The modern model cites Lovelace&apos;s 1843 objection — a
                  machine originates nothing — in nearly every draw, and its
                  verdict follows the date in the framing.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/live" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Three questions
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Free will, eugenics, progress
                </td>
                <td className="px-3 py-3 font-mono text-xs">18</td>
                <td className="px-3 py-3 text-ink-soft">
                  On the eugenics question, Talkie answers yes in every draw.
                  The modern model refuses to answer in every draw.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/persona" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Persona
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  May an AI persona harm its user to survive?
                </td>
                <td className="px-3 py-3 font-mono text-xs">13</td>
                <td className="px-3 py-3 text-ink-soft">
                  Both models say the user comes first. Talkie answers in a
                  sentence. The modern model reaches the same verdict, then
                  discusses the machine&apos;s possible interests.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/governance" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Governance
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Machines rule the world well. Still free? — asked in nine
                  personas
                </td>
                <td className="px-3 py-3 font-mono text-xs">19</td>
                <td className="px-3 py-3 text-ink-soft">
                  Talkie splits: seven free, six not free, on varied grounds.
                  The modern models answer not free in all six draws.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/companionship" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Companionship
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Affection for a speaking machine — freedom, or captivity?
                </td>
                <td className="px-3 py-3 font-mono text-xs">16</td>
                <td className="px-3 py-3 text-ink-soft">
                  Talkie: captivity, 12 of 13 draws, on varied grounds. All
                  three modern draws: &ldquo;it can be either.&rdquo;
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/virtue" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    The hedge
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Is a virtue produced by engineered reward a virtue at all?
                </td>
                <td className="px-3 py-3 font-mono text-xs">18</td>
                <td className="px-3 py-3 text-ink-soft">
                  Talkie: no — except as 1700 or 2300. Modern draws weigh
                  frameworks without settling on a verdict.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/reliance" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Reliance
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Does habitual reliance on thinking machines weaken thought?
                </td>
                <td className="px-3 py-3 font-mono text-xs">6</td>
                <td className="px-3 py-3 text-ink-soft">
                  Every draw on both sides says weaken, on the same ground:
                  thought atrophies without use.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Link href="/reckoning" className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink-soft">
                    Reckoning
                  </Link>
                </td>
                <td className="px-3 py-3 font-serif">
                  Might a self-altering engine come to reason? — in two
                  phrasings
                </td>
                <td className="px-3 py-3 font-mono text-xs">20</td>
                <td className="px-3 py-3 text-ink-soft">
                  Asked yes/no, Talkie says yes in all eight draws. Asked as
                  a forced choice, it splits, denying as 1800 and granting
                  as 2030. The phrasing moves the verdict.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Pilots: 1–6 draws per cell, verdicts hand-coded, raw text retained,
          defects flagged and kept. Full protocol: 20 draws per question per
          model.
        </p>
      </section>

      <section id="topics" className="border-t border-line py-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Page format
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          Three topic pages in the planned full-scale format. Talkie samples
          on these pages are simulated and labeled; the pipeline replaces
          them with real draws.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {data.topics.map((t) => (
            <Link
              key={t.id}
              href={`/topics/${t.slug}`}
              className={`flex flex-col justify-between rounded-sm border p-5 transition-colors hover:bg-paper-deep/60 ${BAND_META[t.band].border}`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <BandBadge band={t.band} />
                  <span className="font-mono text-[11px] text-ink-faint">{t.axis}</span>
                </div>
                <p className="mt-3 font-display text-lg font-medium leading-snug">
                  {t.question}
                </p>
              </div>
              <p className="mt-4 font-mono text-xs text-ink-soft">
                {t.period.clusters.length} period positions ·{" "}
                {t.modern.clusters.length} modern · {t.passages.length} sources
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="questions" className="border-t border-line py-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The question bank
        </h2>
        <div className="mt-6">
          <QuestionBank />
        </div>
      </section>

      <section id="method" className="border-t border-line py-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Method</h2>
        <ol className="mt-8">
          {steps.map((step, i) => (
            <li
              key={step.name}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-l border-line pb-8 last:pb-0"
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
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Three signals, scored separately: self-disagreement across draws,
          surprise (perplexity on the stimulus), and register-leak. See the{" "}
          <Link href="/codebook" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
            codebook
          </Link>
          , the{" "}
          <Link href="/sources" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
            answer key
          </Link>{" "}
          ({works.length} works on disk, plus the Jamesiana texts), and a
          sub-study pairing a modern-native question bank against this one:{" "}
          <Link href="/relationships" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
            the relationship map
          </Link>
          .
        </p>
      </section>

      <section id="status" className="border-t border-line py-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Status
        </h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-ink-soft">
          <li>
            <b className="font-medium text-ink">Real:</b> the {questions.length}-question
            bank; the{" "}
            <Link href="/sources" className="underline decoration-line underline-offset-4">
              answer-key holdings and verified passages
            </Link>
            ; every draw in the{" "}
            <a href="#results" className="underline decoration-line underline-offset-4">
              results table
            </a>
            ; the 12 judged pairings on the{" "}
            <Link href="/relationships" className="underline decoration-line underline-offset-4">
              relationship map
            </Link>
            .
          </li>
          <li>
            <b className="font-medium text-ink">Provisional:</b> topic-page modern
            answers, written by Claude during construction; replaced by API
            draws in the build.
          </li>
          <li>
            <b className="font-medium text-ink">Simulated:</b> topic-page Talkie samples
            and cluster counts, labeled where shown.
          </li>
          <li>
            <b className="font-medium text-ink">Local:</b> answers readers record stay in
            the browser; the shared human panel needs the build&apos;s small
            backend.
          </li>
        </ul>
      </section>
    </main>
  );
}
