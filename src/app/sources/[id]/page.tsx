import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaceToggle } from "@/components/FaceToggle";
import { PassageView } from "@/components/PassageView";
import { Quote } from "@/components/Quote";
import { HeldBack } from "@/components/HeldBack";
import { ReviewCheck, TextFlag } from "@/components/Row";
import {
  formatYear,
  getQuestion,
  getTheme,
  getWork,
  isHeldBack,
  kindLabel,
  passagesForWork,
  quoteFor,
  stancesForWork,
  translationLabel,
  workSorts,
  works,
} from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return works.map((w) => ({ id: w.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sources/[id]">): Promise<Metadata> {
  const w = getWork((await params).id);
  return w ? { title: `${w.authorShort}, ${w.title}` } : {};
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 font-pixel text-[24px] leading-none">
        <FaceToggle>{title}</FaceToggle>
      </h2>
      {children}
    </section>
  );
}

const byYear = [...works].sort(workSorts.year);
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default async function SourcePage({
  params,
}: PageProps<"/sources/[id]">) {
  const w = getWork((await params).id);
  if (!w) notFound();
  const stances = stancesForWork(w.id);
  const passages = passagesForWork(w.id);
  const i = byYear.findIndex((x) => x.id === w.id);
  const prev = byYear[(i - 1 + byYear.length) % byYear.length];
  const next = byYear[(i + 1) % byYear.length];

  const record: [string, React.ReactNode][] = [
    ["Period", w.earlier ? "Earlier work, influential in the period" : null],
    [
      "Original title",
      w.originalTitle && w.originalTitle !== w.title ? (
        <span className="font-serif italic">{w.originalTitle}</span>
      ) : null,
    ],
    ["Also listed as", w.otherTitles.length ? w.otherTitles.join("; ") : null],
    ["Language", w.language],
    ["Form", kindLabel(w.kind)],
    ["Text", <TextFlag key="t" w={w} />],
    [
      "English",
      <span key="e">
        {translationLabel[w.translation.kind]}
        {w.translation.note && (
          <span className="text-ink-soft"> · {w.translation.note}</span>
        )}
      </span>,
    ],
    [
      "Source text",
      w.textUrl ? (
        <a href={w.textUrl} className="text-modern hover:underline">
          {host(w.textUrl)}
        </a>
      ) : null,
    ],
    [
      "Wikidata",
      w.wikidata ? (
        <a
          href={`https://www.wikidata.org/wiki/${w.wikidata}`}
          className="font-mono text-[13px] text-modern hover:underline"
        >
          {w.wikidata}
        </a>
      ) : null,
    ],
    [
      "Selected",
      `${w.selectedBy}, ${w.selectedOn}; suggested by ${w.suggestedBy}`,
    ],
    [
      "Status",
      <span key="s" className="text-provisional">
        Arguments unverified; quotations chosen by machine, unchecked
      </span>,
    ],
  ];

  return (
    <article>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-[15px] text-ink-soft"
      >
        <Link href="/sources" className="hover:text-ink">
          Sources
        </Link>
        <span className="text-ink-faint">/</span>
        <span>{w.authorShort}</span>
      </nav>

      <header className="mt-5">
        <p className="text-[1.2rem] text-ink-soft">
          {w.author}{" "}
          <span className="num font-mono text-[15px] text-ink-faint">
            · {formatYear(w.year)}
          </span>
        </p>
        <h1 className="mt-2 max-w-4xl font-serif text-[2.6rem] leading-[1.05] tracking-[-0.02em] italic sm:text-[3.6rem]">
          {w.title}
        </h1>
      </header>

      <dl className="mt-10 grid max-w-4xl grid-cols-[8.5rem_1fr] gap-x-6 text-[15px] sm:grid-cols-[10rem_1fr]">
        {record
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="border-t border-line py-2 text-ink-faint">{k}</dt>
              <dd className="border-t border-line py-2">{v}</dd>
            </div>
          ))}
      </dl>

      <Section title="Answers">
        <ul className="max-w-4xl">
          {stances.map((s) => {
            const q = getQuestion(s.question);
            const theme = q && getTheme(q.theme);
            return (
              <li
                key={s.id}
                className="border-t border-line py-5 first:border-t-0 first:pt-0"
              >
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <span className="num font-mono text-[12px] text-ink-faint">
                    {s.question}
                  </span>
                  {theme && (
                    <span className="theme-name text-[16px]">
                      {theme.name}
                    </span>
                  )}
                </p>
                <Link
                  href={`/questions/${s.question.toLowerCase()}`}
                  className="mt-1 block text-[1.2rem] leading-snug font-semibold tracking-[-0.01em] hover:underline hover:underline-offset-4"
                >
                  {q?.question}
                </Link>
                {isHeldBack(s) ? (
                  <div className="mt-2">
                    <HeldBack />
                  </div>
                ) : (
                  <>
                  <p className="mt-2 text-[15.5px] leading-relaxed">
                    <span className="font-semibold">{s.sideLabel}.</span>{" "}
                    {s.sideGloss && (
                      <span className="text-ink-soft italic">
                        {s.sideGloss}.{" "}
                      </span>
                    )}
                    {s.argument}
                  </p>
                  <ReviewCheck check={s.reviewCheck} />
                  {quoteFor(s) && (
                    <div className="mt-3">
                      <Quote p={quoteFor(s)!} />
                    </div>
                  )}
                  <p className="mt-2 text-[13px] leading-snug text-ink-faint">
                    {s.where && <span className="font-mono">{s.where} · </span>}
                    {s.checked}
                  </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {passages.length > 0 && (
        <Section title="Passages">
          {passages.map((p) => (
            <PassageView key={p.id} p={p} />
          ))}
        </Section>
      )}

      <nav className="mt-20 grid grid-cols-2 gap-10 border-t border-rule pt-4">
        <Link href={`/sources/${prev.id}`} className="group">
          <span className="label">← Earlier</span>
          <span className="mt-3 block text-[15px] leading-snug">
            <span className="num mr-2 font-mono text-[12px] text-ink-faint">
              {formatYear(prev.year)}
            </span>
            {prev.authorShort},{" "}
            <span className="font-serif italic group-hover:underline group-hover:underline-offset-4">
              {prev.title}
            </span>
          </span>
        </Link>
        <Link href={`/sources/${next.id}`} className="group text-right">
          <span className="label">Later →</span>
          <span className="mt-3 block text-[15px] leading-snug">
            <span className="num mr-2 font-mono text-[12px] text-ink-faint">
              {formatYear(next.year)}
            </span>
            {next.authorShort},{" "}
            <span className="font-serif italic group-hover:underline group-hover:underline-offset-4">
              {next.title}
            </span>
          </span>
        </Link>
      </nav>
    </article>
  );
}
