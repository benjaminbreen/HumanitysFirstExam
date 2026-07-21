import CodeChip from "@/components/CodeChip";
import type {
  HistoricalPassage,
  HistoricalSourceVerification,
  IndependentConvergenceStatus,
} from "@/lib/types";

const SOURCE_LABELS: Record<HistoricalSourceVerification, string> = {
  "repository-text-checked": "repository text checked",
  "scan-checked": "scan and page checked",
  "transcription-checked": "transcription and date checked",
  "transcription-checked-scan-pending": "transcription checked · issue scan pending",
};

const CONVERGENCE_LABELS: Record<IndependentConvergenceStatus, string> = {
  candidate: "candidate for independent comparison",
  "candidate-with-inherited-form": "candidate · inherited literary form noted",
  "exclude-explicit-response": "reception evidence · exclude from independent count",
};

export default function HistoricalPassageCard({ passage }: { passage: HistoricalPassage }) {
  const sourcePending = passage.source.verificationLevel === "transcription-checked-scan-pending";
  const translationPending = passage.translation.reviewStatus === "required";

  return (
    <article className="rounded-sm border border-line border-l-2 border-l-period bg-paper-deep/35 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-period tabular-nums">
            {passage.id} · {passage.year}
          </p>
          <h3 className="mt-1 font-display text-xl font-medium tracking-tight">
            {passage.author}, <i>{passage.title}</i>
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {passage.region} · {passage.language} · {passage.genre}
          </p>
        </div>
        <div className="flex max-w-md flex-wrap justify-end gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
              sourcePending
                ? "border-falsecont/40 bg-falsecont/10 text-falsecont"
                : "border-continuity/40 bg-continuity/10 text-continuity"
            }`}
          >
            {SOURCE_LABELS[passage.source.verificationLevel]}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
              translationPending
                ? "border-falsecont/40 bg-falsecont/10 text-falsecont"
                : "border-continuity/40 bg-continuity/10 text-continuity"
            }`}
          >
            {translationPending ? "working translation · review needed" : "original is English"}
          </span>
        </div>
      </div>

      <div className={`mt-5 grid gap-5 ${passage.englishText ? "lg:grid-cols-2" : ""}`}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            Original · {passage.language}
          </p>
          <blockquote className="mt-2 font-serif text-[1.03rem] leading-relaxed">
            {passage.originalText}
          </blockquote>
        </div>
        {passage.englishText && (
          <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              Working English translation
            </p>
            <blockquote className="mt-2 font-serif text-[1.03rem] leading-relaxed text-ink-soft">
              {passage.englishText}
            </blockquote>
          </div>
        )}
      </div>

      <div className="mt-5 border-l-2 border-l-period/50 pl-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          Source-led question seed
        </p>
        <p className="mt-1 max-w-4xl font-serif text-[1.05rem] leading-relaxed">
          {passage.questionSeed}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-line/70 pt-4 text-sm text-ink-soft">
        <span>{passage.locator}</span>
        <a
          href={passage.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          read the source
        </a>
        <span className="flex flex-wrap gap-1.5">
          {passage.codes.map((code) => (
            <CodeChip key={code} code={code} />
          ))}
        </span>
      </div>

      <details className="mt-4 border-t border-line/70 pt-3 text-sm text-ink-soft">
        <summary className="cursor-pointer font-mono text-[11px] text-ink-soft">
          Record notes
        </summary>
        <div className="mt-3 grid gap-2 leading-relaxed md:grid-cols-[11rem_1fr]">
          <span className="font-mono text-[11px] text-ink-faint">Source check</span>
          <span>{passage.source.note}</span>
          <span className="font-mono text-[11px] text-ink-faint">Translation</span>
          <span>{passage.translation.note}</span>
          <span className="font-mono text-[11px] text-ink-faint">Transmission</span>
          <span>{passage.provenance.relationship}</span>
          <span className="font-mono text-[11px] text-ink-faint">Comparison use</span>
          <span>{CONVERGENCE_LABELS[passage.provenance.independentConvergenceStatus]}</span>
          <span className="font-mono text-[11px] text-ink-faint">Nathan bank links</span>
          <span>Questions {passage.relatedQuestionNumbers.join(", ")}</span>
          {passage.codebookGap && (
            <>
              <span className="font-mono text-[11px] text-ink-faint">Codebook gap</span>
              <span>{passage.codebookGap}</span>
            </>
          )}
        </div>
      </details>
    </article>
  );
}
