import { Cite } from "@/components/Cite";
import { Flag } from "@/components/Row";
import { getWork, type Passage } from "@/lib/data";

// Original and English side by side. Machine translations say so.
export function PassageView({ p, showWork = false }: { p: Passage; showWork?: boolean }) {
  const w = p.work ? getWork(p.work) : undefined;
  const rel = p.relevance.verdict;
  return (
    <figure className="border-t border-line py-5 first:border-t-0">
      <figcaption className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        {showWork && w && <Cite w={w} />}
        <span className="font-mono text-[11.5px] text-ink-faint">{p.questions.join(" · ")}</span>
        {p.translation && <Flag tone="warn">{p.status}</Flag>}
        {rel && (
          <Flag tone={rel === "yes" ? "ok" : rel === "no" ? "muted" : "warn"}>
            relevant: {rel}
          </Flag>
        )}
      </figcaption>
      <div className={`grid gap-x-10 gap-y-4 ${p.translation ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
        <blockquote lang={langCode(p.language)} className="border-l-2 border-period pl-4 font-serif text-[1.02rem] leading-relaxed text-ink-soft">
          {p.original}
        </blockquote>
        {p.translation && <p className="order-first font-serif text-[1.02rem] leading-relaxed md:order-none">{p.translation}</p>}
      </div>
      {p.relevance.reason && <p className="mt-3 text-[13.5px] leading-snug text-ink-soft">{p.relevance.reason}</p>}
    </figure>
  );
}

const codes: Record<string, string> = { Russian: "ru", German: "de", French: "fr", Latin: "la", Italian: "it", Spanish: "es", Czech: "cs", Greek: "grc", Chinese: "zh", Japanese: "ja" };
const langCode = (l: string) => codes[l] ?? "en";
