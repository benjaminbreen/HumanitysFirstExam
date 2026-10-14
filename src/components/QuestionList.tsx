import Link from "next/link";
import { Chevron, summaryClass } from "@/components/Row";
import { Sides } from "@/components/Sides";
import { heldBackForQuestion, questionStats, questionsForTheme, sidesForQuestion, span, type Theme } from "@/lib/data";

// One row per question, grouped by theme. The theme name appears on the
// first row of its group only.
const cols =
  "grid grid-cols-[2.5rem_1fr_1rem] items-baseline gap-x-4 sm:grid-cols-[2.5rem_1fr_8rem_3rem_1rem] lg:grid-cols-[2.5rem_9.5rem_1fr_14rem_7rem_3rem_1rem]";

function Tally({ id }: { id: string }) {
  const sides = sidesForQuestion(id);
  const n = (k: string) => sides.find((s) => s.key === k)?.stances.length ?? 0;
  const other = sides.filter((s) => s.key !== "yes" && s.key !== "no").reduce((a, s) => a + s.stances.length, 0);
  return (
    <span className="num font-mono text-[12px] whitespace-nowrap text-ink-soft">
      {n("yes")} yes · {n("no")} no{other > 0 && ` · ${other} other`}
      {heldBackForQuestion(id) > 0 && ` · ${heldBackForQuestion(id)} held`}
    </span>
  );
}

export function QuestionList({ themes }: { themes: Theme[] }) {
  return (
    <div>
      <div className={`${cols} border-b border-rule pb-2.5`}>
        <span className="label">No.</span>
        <span className="label hidden lg:block">Theme</span>
        <span className="label">Question</span>
        <span className="label hidden lg:block">Answers</span>
        <span className="label hidden sm:block">Span</span>
        <span className="label hidden text-right sm:block">Works</span>
        <span />
      </div>
      {themes.map((theme) => (
        <ol key={theme.slug} className="border-b border-rule last:border-b-0">
          <li className="pt-4 lg:hidden">
            <Link href={`/themes/${theme.slug}`} className="theme-name text-[16px] hover:underline hover:underline-offset-4">
              {theme.name}
            </Link>
          </li>
          {questionsForTheme(theme.slug).map((q, i) => {
            const s = questionStats(q);
            return (
              <li key={q.id} className="border-b border-line last:border-b-0">
                <details className="group">
                  <summary className={`${cols} ${summaryClass}`}>
                    <span className="num font-mono text-xs text-ink-faint">{q.id}</span>
                    <span className="hidden lg:block">
                      {i === 0 && (
                        <Link href={`/themes/${theme.slug}`} className="theme-name text-[16px] hover:underline hover:underline-offset-4">
                          {theme.name}
                        </Link>
                      )}
                    </span>
                    <span className="text-[1.05rem] leading-snug font-medium tracking-[-0.01em]">{q.question}</span>
                    <span className="hidden lg:block"><Tally id={q.id} /></span>
                    <span className="num hidden font-mono text-xs text-ink-soft sm:block">{span(s)}</span>
                    <span className="num hidden text-right font-mono text-[13px] sm:block">{s.workCount}</span>
                    <Chevron />
                  </summary>
                  <div className="pt-2 pb-8 sm:ml-[calc(2.5rem+1rem)] lg:ml-[calc(2.5rem+9.5rem+2rem)]">
                    <p className="mb-5 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                      <span className="lg:hidden"><Tally id={q.id} /></span>
                      <span className="text-ink-soft">{s.languages.join(", ")}</span>
                      <Link href={`/questions/${q.slug}`} className="text-modern hover:underline hover:underline-offset-4">
                        Open question →
                      </Link>
                    </p>
                    <Sides sides={sidesForQuestion(q.id)} held={heldBackForQuestion(q.id)} compact />
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      ))}
    </div>
  );
}
