import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SourceTextReader from "@/components/SourceTextReader";
import {
  classificationSchema,
  codebook,
  data,
  historicalPassages,
  historicalSourceTexts,
  prototypePassages,
} from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return historicalSourceTexts.sources.flatMap((source) => [
    { id: source.sourceId },
    ...(source.passageId ? [{ id: source.passageId }] : []),
  ]);
}

function getSource(id: string) {
  return historicalSourceTexts.sources.find(
    (source) => source.sourceId === id || source.passageId === id,
  );
}

const schemaLabels = new Map(
  [
    ...classificationSchema.themes.flatMap((theme) => theme.children),
    ...codebook.flatMap((branch) => branch.leaves),
    ...classificationSchema.grounds,
    ...classificationSchema.autonomyEffects,
    ...classificationSchema.genres,
    ...classificationSchema.modes,
    ...classificationSchema.relations,
  ].map((option) => [option.id, option.label]),
);

function SchemaLink({ id, suffix }: { id: string; suffix?: string }) {
  return (
    <Link
      href={`/codebook#${id}`}
      className="rounded-md border border-ink-faint/45 px-2 py-1 font-mono text-[10px] text-ink-soft hover:border-ink-soft hover:text-ink"
    >
      {schemaLabels.get(id) ?? id}
      {suffix}
    </Link>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const source = getSource(id);
  if (!source) return {};
  return {
    title: source.title + " · " + data.meta.title,
    description: source.author + ", " + source.year + ". Full source text.",
  };
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = getSource(id);
  if (!source) notFound();

  const passage = historicalPassages.passages.find(
    (item) => item.sourceId === source.sourceId,
  );
  const workingPassage = prototypePassages.passages.find(
    (item) => item.sourceId === source.sourceId,
  );
  const extent =
    source.language === "Japanese"
      ? source.characterCount.toLocaleString() + " characters"
      : source.wordCount.toLocaleString() + " words";

  return (
    <main className="mx-auto max-w-5xl px-5 py-9 md:py-12">
      <nav className="font-mono text-xs">
        <Link href="/sources" className="text-ink-soft hover:text-ink">
          ← Sources
        </Link>
      </nav>

      <header className="mt-8 border-b border-line pb-7">
        <p className="font-mono text-[10px] uppercase tracking-wider text-period">
          {source.year} · {source.language}
          {source.region ? " · " + source.region : ""}
        </p>
        <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          {source.title}
        </h1>
        <p className="mt-2 font-serif text-lg text-ink-soft">{source.author}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-xs">
          <a href="#text" className="underline decoration-line underline-offset-4">
            Read text ↓
          </a>
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          >
            View source edition ↗
          </a>
          <a
            href={source.textPath}
            download
            className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          >
            Download text
          </a>
        </div>
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
        <div className="min-w-0">
          {passage && (
            <details className="mb-9 border-y border-line py-4">
              <summary className="cursor-pointer font-mono text-xs text-ink-soft hover:text-ink">
                Passage selected for Humanity&apos;s First Exam
              </summary>
              <div className="mt-5">
                <blockquote className="border-l-2 border-period pl-5 text-lg leading-relaxed">
                  {passage.originalText}
                </blockquote>
                {passage.englishText && (
                  <div className="mt-5 border-l border-line pl-5">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                      Working English translation
                    </p>
                    <p className="mt-2 leading-relaxed text-ink-soft">
                      {passage.englishText}
                    </p>
                  </div>
                )}
                <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                  {passage.locator}
                </p>
              </div>
            </details>
          )}

          {workingPassage && (
            <details open className="mb-9 border-y border-line py-4">
              <summary className="cursor-pointer font-mono text-xs text-ink-soft hover:text-ink">
                Selected passage and classification
              </summary>
              <div className="mt-5">
                <blockquote className="border-l-2 border-period pl-5 text-lg leading-relaxed">
                  {workingPassage.originalText}
                </blockquote>
                {workingPassage.englishText && (
                  <div className="mt-5 border-l border-line pl-5">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                      Working English translation
                    </p>
                    <p className="mt-2 leading-relaxed text-ink-soft">
                      {workingPassage.englishText}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {workingPassage.classification.themes.map((theme) => (
                    <SchemaLink key={theme} id={theme} />
                  ))}
                  {workingPassage.classification.claims.map((claim) => (
                    <SchemaLink
                      key={claim.claimId}
                      id={claim.claimId}
                      suffix={` · ${schemaLabels.get(claim.relation) ?? claim.relation}`}
                    />
                  ))}
                  <SchemaLink id={workingPassage.classification.autonomyEffect} />
                </div>

                <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                  {workingPassage.classification.rationale}
                </p>
                <p className="mt-3 font-mono text-[10px] text-ink-faint">
                  {workingPassage.locator}
                  {workingPassage.sourceCheckRequired
                    ? " · source wording still to be checked"
                    : ""}
                </p>
              </div>
            </details>
          )}

          <section id="text" className="scroll-mt-8">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Text
              </h2>
              <span className="font-mono text-[10px] text-ink-faint">{extent}</span>
            </div>
            <SourceTextReader
              path={source.textPath}
              title={source.title}
              language={source.language}
            />
          </section>
        </div>

        <aside className="border-t border-line pt-5 text-sm leading-relaxed text-ink-soft lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            Why this source
          </h2>
          <p className="mt-2">{source.relevance}</p>

          <dl className="mt-7 space-y-5">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Reading copy
              </dt>
              <dd className="mt-1">
                {source.status === "ocr-transcription"
                  ? "OCR transcription; check uncertain readings against the scan."
                  : "Repository transcription retained locally for reading and search."}
              </dd>
            </div>
            {passage && (
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                  Passage check
                </dt>
                <dd className="mt-1">{passage.source.note}</dd>
              </div>
            )}
            {workingPassage && (
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                  Classification
                </dt>
                <dd className="mt-1">
                  Tags connect the passage to the project&apos;s historical concept space.
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </main>
  );
}
