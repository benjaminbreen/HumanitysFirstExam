import type { Metadata } from "next";
import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import CodeChip from "@/components/CodeChip";
import { data, getCode, q33AnswerKey } from "@/lib/data";
import type { AnswerKeyAttestation, AnswerKeyPosition } from "@/lib/types";

export const metadata: Metadata = {
  title: `Q33 answer key · ${data.meta.title}`,
  description:
    "How source passages become historically attested answers and a computable benchmark key.",
};

function VerdictChip({ verdict }: { verdict: AnswerKeyPosition["verdict"] }) {
  const frees = verdict === "frees";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
        frees
          ? "border-continuity/40 bg-continuity/10 text-continuity"
          : "border-period/40 bg-period/10 text-period"
      }`}
    >
      verdict: {verdict}
    </span>
  );
}

function EvidencePassage({ attestation }: { attestation: AnswerKeyAttestation }) {
  const translationPending = attestation.textStatus === "working-translation-review-required";
  return (
    <article className="border-t border-line/70 pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-soft">
          <span className="font-mono text-xs text-period">{attestation.year}</span>{" "}
          — {attestation.author}, <i>{attestation.title}</i>
        </p>
        {translationPending && (
          <span className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2 py-0.5 font-mono text-[10px] text-falsecont">
            working translation · review needed
          </span>
        )}
      </div>

      {attestation.englishText ? (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              Original · {attestation.language}
            </p>
            <blockquote className="mt-1.5 font-serif leading-relaxed">
              {attestation.originalText}
            </blockquote>
          </div>
          <div className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              Working English translation
            </p>
            <blockquote className="mt-1.5 font-serif leading-relaxed text-ink-soft">
              {attestation.englishText}
            </blockquote>
          </div>
        </div>
      ) : (
        <blockquote className="mt-3 font-serif leading-relaxed">
          {attestation.originalText}
        </blockquote>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          Why it counts
        </span>{" "}
        {attestation.codingRationale}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ink-soft">
        <span>{attestation.locator}</span>
        <a
          href={attestation.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          read the source
        </a>
      </div>
    </article>
  );
}

export default function Q33AnswerKeyPage() {
  const admittedById = new Map(
    q33AnswerKey.candidateAttestations
      .filter((attestation) => attestation.decision === "admitted")
      .map((attestation) => [attestation.id, attestation]),
  );
  const excluded = q33AnswerKey.candidateAttestations.filter(
    (attestation) => attestation.decision === "excluded",
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <Link
        href="/sources"
        className="font-mono text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
      >
        ← Answer key
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-period">
            Worked answer key · Q{q33AnswerKey.question.n}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            From passages to an answer key
          </h1>
        </div>
        <span className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont">
          draft for two-coder review · not benchmark-ready
        </span>
      </div>

      <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">
        This page shows the missing step between collecting sources and scoring
        respondents. A passage is admitted only when it directly answers the
        question. Similar answers are then consolidated into a position, while
        every citation and exclusion remains visible.
      </p>

      <section className="mt-8 rounded-sm border border-period/30 bg-paper-deep/50 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-period">Q{q33AnswerKey.question.n}</span>
          <BandBadge band={q33AnswerKey.question.band} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            {q33AnswerKey.question.axis}
          </span>
        </div>
        <p className="mt-3 max-w-4xl font-display text-2xl leading-snug">
          {q33AnswerKey.question.text}
        </p>
      </section>

      <section className="mt-8 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4">
        {[
          [q33AnswerKey.meta.candidateAttestationCount, "candidate passages"],
          [q33AnswerKey.meta.admittedAttestationCount, "admitted attestations"],
          [q33AnswerKey.meta.positionCount, "historical answers"],
          [q33AnswerKey.meta.sourceTraditionCount, "source traditions"],
        ].map(([value, label]) => (
          <div key={label} className="bg-paper px-4 py-4">
            <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The five answers in the key
        </h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">
          These five cards—not the source list—are what a set of responses is
          scored against. The passages beneath each card show why that answer is
          in the key.
        </p>

        <div className="mt-6 space-y-7">
          {q33AnswerKey.positions.map((position, index) => {
            const attestations = position.attestationIds
              .map((id) => admittedById.get(id))
              .filter((attestation): attestation is AnswerKeyAttestation => Boolean(attestation));
            const code = getCode(position.primaryGroundId);
            return (
              <article key={position.id} className="rounded-sm border border-line bg-paper-deep/30">
                <div className="border-b border-line p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink-faint">
                      Answer {index + 1}
                    </span>
                    <VerdictChip verdict={position.verdict} />
                    <CodeChip code={position.primaryGroundId} />
                    <span className="font-mono text-[10px] text-ink-faint">
                      {position.sourceTraditionCount} source {position.sourceTraditionCount === 1 ? "tradition" : "traditions"}
                      {position.evidenceStatus === "singleton" ? " · singleton" : " · repeated"}
                    </span>
                  </div>
                  <h3 className="mt-3 max-w-4xl font-display text-xl font-medium leading-snug">
                    {position.label}
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    Primary ground: {code?.label ?? position.primaryGroundId}
                    {position.groundFit === "partial" ? " (partial codebook fit)" : ""}.
                  </p>
                  {position.codebookGap && (
                    <p className="mt-3 rounded-sm border border-falsecont/30 bg-falsecont/5 px-3 py-2 text-sm leading-relaxed text-ink-soft">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-falsecont">
                        Codebook gap
                      </span>{" "}
                      {position.codebookGap}
                    </p>
                  )}
                </div>
                <div className="space-y-4 p-5 md:p-6">
                  {attestations.map((attestation) => (
                    <EvidencePassage key={attestation.id} attestation={attestation} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Candidates kept out of the key
        </h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">
          A thematic resemblance is not enough. These passages remain in the
          audit trail, but they do not increase Q33’s historical coverage score.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {excluded.map((attestation) => (
            <article key={attestation.id} className="rounded-sm border border-line p-5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-falsecont">
                excluded · near fit
              </p>
              <h3 className="mt-2 font-display text-lg font-medium">
                {attestation.author}, <i>{attestation.title}</i>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {attestation.codingRationale}
              </p>
              <details className="mt-3 text-sm text-ink-soft">
                <summary className="cursor-pointer font-mono text-[11px]">Show candidate passage</summary>
                <blockquote className="mt-3 font-serif leading-relaxed">
                  {attestation.englishText ?? attestation.originalText}
                </blockquote>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-sm border border-modern/30 bg-modern/5 p-5 md:p-7">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          How this becomes a score
        </h2>
        <p className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-modern">
          coverage@N = distinct key answers occupied by committed responses ÷ 5 eligible answers
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          A draw counts only when it takes the answer’s verdict and argues from
          its primary ground. Merely listing an answer does not count. Positions
          are weighted equally; citation counts document evidence strength, not
          historical prevalence.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-ink-soft sm:grid-cols-2">
          <p><span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Also report</span><br />coverage at 1, 5, 10, and 20 draws; commitment rate; out-of-key rate; bootstrap interval.</p>
          <p><span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Still required</span><br />two independent human coders, adjudication, language review for two translations, and real Q33 response draws.</p>
        </div>
      </section>
    </main>
  );
}
