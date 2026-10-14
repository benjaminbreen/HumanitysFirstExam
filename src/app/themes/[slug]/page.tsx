import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Direction } from "@/components/Direction";
import { FaceToggle } from "@/components/FaceToggle";
import { Cite } from "@/components/Cite";
import { Sides } from "@/components/Sides";
import { getTheme, heldBackForQuestion, questionsForTheme, sidesForQuestion, span, themeStats, themeWorks, themes } from "@/lib/data";
import { getTrial } from "@/lib/trials";

export const dynamicParams = false;

export function generateStaticParams() {
  return themes.map((t) => ({ slug: t.slug }));
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export async function generateMetadata({
  params,
}: PageProps<"/themes/[slug]">): Promise<Metadata> {
  const theme = getTheme((await params).slug);
  return theme ? { title: titleCase(theme.name), description: theme.question } : {};
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 font-pixel text-[24px] leading-none">
        <FaceToggle>{title}</FaceToggle>
      </h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-ink-faint">{label}</span>{" "}
      <span className="text-ink">{children}</span>
    </div>
  );
}

export default async function ThemePage({ params }: PageProps<"/themes/[slug]">) {
  const theme = getTheme((await params).slug);
  if (!theme) notFound();
  const s = themeStats(theme);
  const i = themes.findIndex((t) => t.slug === theme.slug);
  const prev = themes[(i - 1 + themes.length) % themes.length];
  const next = themes[(i + 1) % themes.length];

  return (
    <article>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[15px] text-ink-soft">
        <Link href="/" className="hover:text-ink">Themes</Link>
        <span className="text-ink-faint">/</span>
        <span className="theme-name text-[16px]">{theme.name}</span>
      </nav>

      <header className="mt-5 border-b border-line pb-10">
        <h1 className="max-w-4xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] sm:text-[3.9rem]">
          {theme.question}
        </h1>
        <p className="mt-6 max-w-3xl text-[1.2rem] leading-relaxed text-ink-soft">
          {theme.summary}
        </p>
        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
          <Fact label="Direction"><Direction direction={theme.direction} /></Fact>
          <Fact label="Span"><span className="num">{span(s)}</span></Fact>
          <Fact label="Questions"><span className="num">{s.questionCount}</span></Fact>
          <Fact label="Works"><span className="num">{s.workCount}</span></Fact>
          <Fact label="Languages">{s.languages.join(", ")}</Fact>
        </div>
      </header>

      <Section title="Questions">
        <ol className="space-y-14">
          {questionsForTheme(theme.slug).map((q) => (
            <li key={q.id}>
              <Link href={`/questions/${q.slug}`} className="group block">
                <span className="num font-mono text-[12px] text-ink-faint">{q.id}</span>
                <span className="mt-1 block text-[1.5rem] leading-tight font-semibold tracking-[-0.02em] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {q.question}
                </span>
              </Link>
              <div className="mt-5">
                <Sides sides={sidesForQuestion(q.id)} held={heldBackForQuestion(q.id)} compact />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Works">
        <ul className="columns-1 gap-x-10 text-[15px] leading-snug md:columns-2">
          {themeWorks(theme).map((w) => (
            <li key={w.id} className="break-inside-avoid border-t border-line py-1.5">
              <Cite w={w} />
            </li>
          ))}
        </ul>
      </Section>

      {getTrial(theme.slug) && (
        <p className="mt-12 text-[15px] text-ink-soft">
          An early pilot tested models against seven arguments on this question. That list of arguments has since been replaced.{" "}
          <Link href={`/themes/${theme.slug}/results`} className="text-modern hover:underline hover:underline-offset-4">
            Pilot results (earlier method) →
          </Link>
        </p>
      )}

      <nav className="mt-20 grid grid-cols-2 gap-10 border-t border-rule pt-4">
        <Link href={`/themes/${prev.slug}`} className="group">
          <span className="label">← Previous</span>
          <span className="theme-name mt-3 block text-[16px]">{prev.name}</span>
          <span className="mt-2 block text-[1.05rem] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">{prev.question}</span>
        </Link>
        <Link href={`/themes/${next.slug}`} className="group text-right">
          <span className="label">Next →</span>
          <span className="theme-name mt-3 block text-[16px]">{next.name}</span>
          <span className="mt-2 block text-[1.05rem] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">{next.question}</span>
        </Link>
      </nav>
    </article>
  );
}
