import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import {
  FAMILY_META,
  FAMILY_ORDER,
  historicalPassages,
  prototypePassages,
  questions,
  questionSourceMatches,
} from "@/lib/data";
import type { HistoricalPassage, PrototypePassage, Question } from "@/lib/types";

interface QuestionSourceCard {
  id: string;
  sourceId: string;
  author: string;
  title: string;
  year: number;
  language: string;
  excerpt: string;
}

function compactExcerpt(text: string, wordLimit = 90) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= wordLimit) return words.join(" ");
  return `${words.slice(0, wordLimit).join(" ")}…`;
}

function normalizePassage(
  passage: HistoricalPassage | PrototypePassage,
): QuestionSourceCard {
  return {
    id: passage.id,
    sourceId: passage.sourceId,
    author: passage.author,
    title: passage.title,
    year: passage.year,
    language: passage.language,
    excerpt: compactExcerpt(passage.englishText ?? passage.originalText),
  };
}

const passageById = new Map<string, QuestionSourceCard>([
  ...historicalPassages.passages.map((passage) => [
    passage.id,
    normalizePassage(passage),
  ] as const),
  ...prototypePassages.passages.map((passage) => [
    passage.id,
    normalizePassage(passage),
  ] as const),
]);

const matchesByQuestion = new Map(
  questionSourceMatches.questions.map((matchSet) => [
    matchSet.question,
    matchSet.passageIds.flatMap((id) => {
      const passage = passageById.get(id);
      return passage ? [passage] : [];
    }),
  ]),
);

function QuestionMetadata({ q }: { q: Question }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {q.axis}
      </span>
      <BandBadge band={q.band} />
      {q.referent && (
        <span className="font-mono text-[11px] text-ink-soft">
          [{q.referent}
          {q.surprise ? ` · expected surprise ${q.surprise}` : ""}]
        </span>
      )}
    </div>
  );
}

function SourceMatch({ source }: { source: QuestionSourceCard }) {
  return (
    <article className="grid gap-1.5 border-t border-line/70 py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {source.year}
        <span className="hidden sm:inline"> · </span>
        <span className="sm:block">{source.language}</span>
      </p>
      <div>
        <p className="text-sm text-ink-soft">{source.author}</p>
        <h4 className="mt-0.5 font-display text-base font-medium leading-snug">
          {source.title}
        </h4>
        <blockquote className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          {source.excerpt}
        </blockquote>
        <Link
          href={`/sources/${source.sourceId}`}
          className="mt-2 inline-block font-mono text-[10px] uppercase tracking-wider underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Read full source →
        </Link>
      </div>
    </article>
  );
}

function QuestionWithSources({
  q,
  sources,
}: {
  q: Question;
  sources: QuestionSourceCard[];
}) {
  const initialSources = sources.slice(0, 5);
  const additionalSources = sources.slice(5);

  return (
    <li>
      <details className="question-details group">
        <summary className="question-summary grid cursor-pointer grid-cols-[2.25rem_1fr] gap-x-2 py-3">
          <span className="font-mono text-xs text-ink-faint tabular-nums">
            {q.n}.
          </span>
          <div>
            <p className="max-w-3xl font-serif leading-relaxed">{q.text}</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <QuestionMetadata q={q} />
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-period">
                {sources.length} historical sources
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-open:rotate-90"
                >
                  →
                </span>
              </span>
            </div>
          </div>
        </summary>

        <div className="question-source-panel ml-9 border-l border-line pl-4 sm:pl-6">
          {q.workedTopic && (
            <Link
              href={`/topics/${q.workedTopic}`}
              className="mb-1 inline-block font-mono text-[10px] uppercase tracking-wider underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Open worked model comparison →
            </Link>
          )}
          <div>
            {initialSources.map((source) => (
              <SourceMatch key={source.id} source={source} />
            ))}
          </div>
          {additionalSources.length > 0 && (
            <details className="group/more border-t border-line/70">
              <summary className="question-more-summary flex cursor-pointer items-center gap-2 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink">
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-open/more:rotate-90"
                >
                  →
                </span>
                Show {additionalSources.length} more
              </summary>
              <div className="question-source-panel">
                {additionalSources.map((source) => (
                  <SourceMatch key={source.id} source={source} />
                ))}
              </div>
            </details>
          )}
        </div>
      </details>
    </li>
  );
}

export default function QuestionBank() {
  return (
    <div>
      <p className="text-sm text-ink-soft">
        {questions.length} questions · authored by Nathan Davies · naming
        constraint: no post-1930 term for a post-1930 thing.
      </p>

      <div className="mt-6 space-y-8">
        {FAMILY_ORDER.map((fam) => {
          const famQuestions = questions.filter((q) => q.family === fam);
          return (
            <section key={fam}>
              <h3 className="font-display text-lg font-medium">
                {FAMILY_META[fam].label}
                <span className="ml-2 font-mono text-xs font-normal text-ink-faint">
                  {famQuestions.length}
                </span>
              </h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">
                {FAMILY_META[fam].blurb}
              </p>
              <ol className="mt-4 divide-y divide-line/70 border-y border-line/70">
                {famQuestions.map((q) => {
                  const sources = matchesByQuestion.get(q.n);
                  if (sources?.length) {
                    return <QuestionWithSources key={q.n} q={q} sources={sources} />;
                  }

                  return (
                    <li
                      key={q.n}
                      className="grid grid-cols-[2.25rem_1fr] gap-x-2 py-3"
                    >
                      <span className="font-mono text-xs text-ink-faint tabular-nums">
                        {q.n}.
                      </span>
                      <div>
                        <p className="max-w-3xl font-serif leading-relaxed">
                          {q.text}
                        </p>
                        <QuestionMetadata q={q} />
                        {q.workedTopic && (
                          <Link
                            href={`/topics/${q.workedTopic}`}
                            className="mt-1 inline-block font-mono text-[11px] text-ink underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                          >
                            worked example →
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
