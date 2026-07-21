import Link from "next/link";
import BandBadge from "@/components/BandBadge";
import { FAMILY_META, FAMILY_ORDER, questions } from "@/lib/data";

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
                {famQuestions.map((q) => (
                  <li key={q.n} className="grid grid-cols-[2.25rem_1fr] gap-x-2 py-3">
                    <span className="font-mono text-xs text-ink-faint tabular-nums">
                      {q.n}.
                    </span>
                    <div>
                      <p className="max-w-3xl font-serif leading-relaxed">{q.text}</p>
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
                        {q.workedTopic && (
                          <Link
                            href={`/topics/${q.workedTopic}`}
                            className="font-mono text-[11px] text-ink underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                          >
                            worked example →
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
