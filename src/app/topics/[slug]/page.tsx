import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BandBadge from "@/components/BandBadge";
import CodeComparison from "@/components/CodeComparison";
import HumanAnswer from "@/components/HumanAnswer";
import SourcePassageCard from "@/components/SourcePassageCard";
import SurveyBlock from "@/components/SurveyBlock";
import { data, engine, getTopic } from "@/lib/data";

export function generateStaticParams() {
  return data.topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  return {
    title: `${topic.title} · ${data.meta.title}`,
    description: topic.question,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const bookend = topic.bookendWith ? getTopic(topic.bookendWith) : undefined;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/#topics" className="text-ink-soft hover:text-ink">
          ← All topics
        </Link>
      </nav>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <BandBadge band={topic.band} />
          <span className="font-mono text-[11px] text-ink-faint">{topic.axis}</span>
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {topic.question}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Completion opening given to the period model:{" "}
          <span className="font-serif text-base italic">“{topic.opening}”</span>
        </p>
      </header>

      {topic.slug === engine.topicSlug && (
        <aside className="mt-8 max-w-3xl rounded-sm border border-continuity/40 bg-continuity/5 p-4 text-sm leading-relaxed text-ink-soft">
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            real model outputs
          </span>{" "}
          Real pilot draws exist for this opening — Talkie and nine isolated
          frontier-model instances under three temporal framings:{" "}
          <Link
            href="/engine"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            the self-altering engine →
          </Link>
        </aside>
      )}

      <div className="mt-8">
        <HumanAnswer topicSlug={topic.slug} />
      </div>

      <div className="mt-10 space-y-12">
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Coded positions, compared
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
            Draw counts aggregated by{" "}
            <Link href="/codebook" className="underline decoration-line underline-offset-4 hover:decoration-ink-soft">
              codebook
            </Link>{" "}
            code. Talkie counts are simulated in this prototype.
          </p>
          <div className="mt-4">
            <CodeComparison topic={topic} />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Modern model · 20 draws
          </h2>
          <div className="mt-4">
            <SurveyBlock survey={topic.modern} register="modern" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Talkie (pre-1931 corpus) · 20 draws
          </h2>
          <div className="mt-4">
            <SurveyBlock survey={topic.period} register="period" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Primary sources
          </h2>
          <div className="mt-4 space-y-4">
            {topic.passages.map((p) => (
              <SourcePassageCard key={p.id} passage={p} />
            ))}
          </div>
        </section>

        <section className="rounded-sm border-l-2 border-ink/60 bg-paper-deep/40 p-5 md:p-6">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            Curatorial note
          </h2>
          <p className="mt-3 max-w-3xl font-serif text-[1.02rem] leading-relaxed">
            {topic.curatorialNote}
          </p>
        </section>

        {bookend && (
          <p className="text-ink-soft">
            Bookend topic:{" "}
            <Link
              href={`/topics/${bookend.slug}`}
              className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
            >
              {bookend.question} →
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
