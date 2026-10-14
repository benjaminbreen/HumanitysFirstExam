import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaceToggle } from "@/components/FaceToggle";
import { PassageView } from "@/components/PassageView";
import { Sides } from "@/components/Sides";
import {
  getQuestion,
  getTheme,
  passagesForQuestion,
  questionStats,
  questions,
  heldBackForQuestion,
  sidesForQuestion,
  span,
} from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return questions.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({ params }: PageProps<"/questions/[slug]">): Promise<Metadata> {
  const q = getQuestion((await params).slug);
  return q ? { title: `${q.id}: ${q.question}` } : {};
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
      <span className="text-ink-faint">{label}</span> <span className="text-ink">{children}</span>
    </div>
  );
}

export default async function QuestionPage({ params }: PageProps<"/questions/[slug]">) {
  const q = getQuestion((await params).slug);
  if (!q) notFound();
  const theme = getTheme(q.theme);
  const s = questionStats(q);
  const passages = passagesForQuestion(q.id);
  const i = questions.findIndex((x) => x.id === q.id);
  const prev = questions[(i - 1 + questions.length) % questions.length];
  const next = questions[(i + 1) % questions.length];

  return (
    <article>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[15px] text-ink-soft">
        <Link href="/" className="hover:text-ink">Themes</Link>
        <span className="text-ink-faint">/</span>
        <span className="num font-mono text-[13px]">{q.id}</span>
      </nav>

      <header className="mt-5 border-b border-line pb-10">
        {theme && (
          <Link href={`/themes/${theme.slug}`} className="theme-name text-[16px] hover:underline hover:underline-offset-4">
            {theme.name}
          </Link>
        )}
        <h1 className="mt-3 max-w-4xl text-[2.4rem] leading-[1.04] font-semibold tracking-[-0.035em] sm:text-[3.5rem]">
          {q.question}
        </h1>
        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
          <Fact label="Span"><span className="num">{span(s)}</span></Fact>
          <Fact label="Works"><span className="num">{s.workCount}</span></Fact>
          <Fact label="Languages">{s.languages.join(", ")}</Fact>
          <Fact label="Status"><span className="text-provisional">Draft question. Claude chose the answers and quotations, and they have not been checked</span></Fact>
        </div>
      </header>

      <Section title="Answers">
        <Sides sides={sidesForQuestion(q.id)} held={heldBackForQuestion(q.id)} />
      </Section>

      {passages.length > 0 && (
        <Section title="Passages">
          {passages.map((p) => (
            <PassageView key={p.id} p={p} showWork />
          ))}
        </Section>
      )}

      <p className="mt-12 text-[15px]">
        <Link href={`/search?q=${encodeURIComponent(q.question)}`} className="text-modern hover:underline hover:underline-offset-4">
          Search the corpora for this question →
        </Link>
      </p>

      <nav className="mt-20 grid grid-cols-2 gap-10 border-t border-rule pt-4">
        <Link href={`/questions/${prev.slug}`} className="group">
          <span className="label">← {prev.id}</span>
          <span className="mt-3 block text-[1.05rem] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">{prev.question}</span>
        </Link>
        <Link href={`/questions/${next.slug}`} className="group text-right">
          <span className="label">{next.id} →</span>
          <span className="mt-3 block text-[1.05rem] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">{next.question}</span>
        </Link>
      </nav>
    </article>
  );
}
