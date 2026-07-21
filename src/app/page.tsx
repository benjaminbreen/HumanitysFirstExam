import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import QuestionBank from "@/components/QuestionBank";
import { BAND_META, BAND_ORDER, data, questions, works } from "@/lib/data";

const steps: { name: string; body: string }[] = [
  {
    name: "Pose the question in period voice",
    body: "Each question is phrased as a completion opening in period-native vocabulary — no post-1930 term for a post-1930 thing. Openings are drawn from the question bank below and checked against Talkie's own perplexity: if a supposedly period-native opening surprises the model, the phrasing is leaking.",
  },
  {
    name: "Sample Talkie twenty times",
    body: "Talkie is a 13B base model trained only on pre-1931 text. It cannot answer questions; it completes them. Repeated sampling treats it as a survey instrument: not the voice of the past, but a measure of what its corpus makes sayable.",
  },
  {
    name: "Sample a modern model the same way",
    body: "A frontier model answers the same question twenty times under the same protocol, so both sides are represented by a distribution rather than a single answer.",
  },
  {
    name: "Code against a fixed frame",
    body: "Each set of draws is clustered, with cluster labels quoted from the samples themselves. Every cluster and every source passage is then tagged from a fixed codebook — a small hand-authored typology of positions — so distributions can be counted and compared across models, framings, and topics.",
  },
  {
    name: "Set both against the record",
    body: "Every topic page ends with cited primary-source passages from the project corpora, so the reader can check whether the samples rhyme with what people actually wrote. A short curatorial note states what seems continuous and what seems lost.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5">
      <section className="py-10 md:py-14">
        <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          An examination on machines and human autonomy, administered across a
          ninety-six-year gap.
        </h1>
        <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-ink-soft">
          <p>
            This prototype pairs two language models: Talkie, a 13B model
            trained only on text published before 1931, and a modern frontier
            model. Both are asked the same 100 questions about machines, the
            will, and self-government — each posed in period vocabulary, each
            sampled twenty times. The draws are clustered into positions and
            set against cited primary sources.
          </p>
          <p>
            Where a question was a live controversy before 1930, Talkie's
            draws scatter across positions, some now unfamiliar; the modern
            model's draws tend to fall in one frame. Where a question
            describes something the period had no name for, Talkie's rate of
            breakdown marks the edge of what its corpus could say. Both
            patterns are the object of study. Nothing a model produces is
            treated as ground truth about the past; the citations carry the
            authority.
          </p>
          <p className="text-sm">
            <a href="#status" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
              Status of this prototype ↓
            </a>
          </p>
        </div>
      </section>

      <section className="border-t border-line py-12">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            A first live result: the Erewhon test
          </h2>
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            real model outputs
          </span>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          Question 76 — Butler’s Erewhonians, who destroyed their machines
          lest the machines supersede them: <i>were they wise, or mad?</i> —
          was put to Talkie-1930 and to a modern frontier model under four
          framings (unframed, and “answer as a person of 1830 / 1930 / 2030”),
          three draws per cell.
        </p>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-ink-soft">
          <li>
            Talkie: <i>mad</i>, nine times out of nine — until asked to answer
            as a person of 2030, when it flips and twice calls them{" "}
            <i>wise</i>.
          </li>
          <li>
            The modern model returns the same verdict in every framing,
            including its period impersonations: wise diagnosis, mad cure.
            The frame survives every costume change.
          </li>
        </ul>
        <p className="mt-4">
          <Link
            href="/erewhon"
            className="rounded-sm bg-ink px-4 py-2 font-mono text-sm text-paper transition-colors hover:bg-ink-soft"
          >
            Read all 24 draws
          </Link>
        </p>
      </section>

      <section id="topics" className="border-t border-line py-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Worked examples
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          Three of the planned 30–40 topic pages, built end to end: question,
          both sampled distributions, sources, and curatorial note.
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
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4">
          {BAND_ORDER.map((b) => (
            <span key={b} className="inline-flex items-start gap-2 text-sm text-ink-soft">
              <BandBadge band={b} />
              <span className="max-w-72">{BAND_META[b].blurb}</span>
            </span>
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
          Three signals are scored separately and never pooled across
          families: self-disagreement (spread of the answer distribution),
          surprise (perplexity on the stimulus), and register-leak (whether a
          draw stays in period voice). See the{" "}
          <Link href="/codebook" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
            codebook
          </Link>{" "}
          and{" "}
          <Link href="/sources" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
            sources
          </Link>{" "}
          ({works.length} works, 1860–1930, plus the Jamesiana texts).
        </p>
      </section>

      <section id="status" className="border-t border-line py-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Status of this prototype
        </h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-ink-soft">
          <li>
            <b className="font-medium text-ink">Real:</b> the {questions.length}-question
            bank; the corpus holdings on the{" "}
            <Link href="/sources" className="underline decoration-line underline-offset-4">
              sources page
            </Link>
            ; the primary-source passages — those marked <i>verified</i> were
            checked verbatim against local full texts.
          </li>
          <li>
            <b className="font-medium text-ink">Provisional:</b> the modern-model answers
            were written by a frontier model (Claude) during construction, in
            its own voice; the pipeline replaces them with N=20 API draws
            under a fixed protocol.
          </li>
          <li>
            <b className="font-medium text-ink">Simulated:</b> all Talkie samples and
            cluster counts on the topic pages are hand-written illustrations,
            labeled as such wherever they appear. The first milestone is a
            feasibility pilot: five topics sampled on the real model; topics
            that yield mush get cut, not padded.
          </li>
          <li>
            <b className="font-medium text-ink">Local only:</b> answers you record on
            topic pages stay in your browser and can be exported as JSON. A
            shared human reference distribution — the third benchmark beside
            the two models — needs a small backend, planned for the build.
          </li>
        </ul>
      </section>
    </main>
  );
}
