import type { Metadata } from "next";
import Link from "next/link";
import HistoricalPassageCard from "@/components/HistoricalPassageCard";
import SourcePassageCard from "@/components/SourcePassageCard";
import { data, historicalPassages, works } from "@/lib/data";

export const metadata: Metadata = {
  title: `Answer key · ${data.meta.title}`,
  description:
    "The admitted primary-source passages that define the historical answer key, with source and translation status shown separately.",
};

export default function SourcesPage() {
  const passages = data.topics.flatMap((t) =>
    t.passages.map((p) => ({ ...p, topicSlug: t.slug, topicTitle: t.title })),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Answer key
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
        The answer key is made of passages, not book titles. A work enters it
        only when a relevant passage has an edition, locator, original text,
        source link, and codebook labels. Source checking and translation
        review are reported separately. Target: 300–500 admitted passages,
        1859–1940; the question instrument itself uses 1860–1930.
      </p>

      <Link
        href="/answer-key/q33"
        className="mt-5 block max-w-3xl rounded-sm border border-period/30 bg-period/5 p-4 hover:border-period/60"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-period">
          New worked prototype · Q33
        </span>
        <span className="mt-1 block font-display text-lg font-medium">
          See how nine candidate passages become five scorable historical answers →
        </span>
      </Link>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Multilingual passage pilot
          </h2>
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            real pilot data
          </span>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          {historicalPassages.meta.passageCount} passages from{" "}
          {historicalPassages.meta.sourceCount} primary sources in{" "}
          {historicalPassages.meta.languageCount} languages. Every source text
          and locator has been checked; {historicalPassages.meta.originalScanPendingCount}{" "}
          record still needs its original periodical scan. {historicalPassages.meta.translationReviewRequiredCount}{" "}
          English renderings are working translations and are labeled as such.
          The question under each passage is a draft derived from that source,
          not a frozen exam item.
        </p>
        <div className="mt-6 space-y-6">
          {historicalPassages.passages.map((passage) => (
            <HistoricalPassageCard key={passage.id} passage={passage} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Passages cited in the worked examples
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          These older records support the existing topic mockups and live-run
          pages. They remain separate while their fields are migrated into the
          stricter multilingual schema above.
        </p>
        <div className="mt-6 space-y-5">
          {passages.map((p) => (
            <div key={`${p.topicSlug}-${p.id}`}>
              <p className="mb-1 font-mono text-[11px] text-ink-faint">
                cited in{" "}
                <Link
                  href={`/topics/${p.topicSlug}`}
                  className="underline decoration-line underline-offset-4 hover:text-ink"
                >
                  {p.topicTitle}
                </Link>
              </p>
              <SourcePassageCard passage={p} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Retrieval inventory — not yet the answer key
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          This {works.length}-item table is the earlier search inventory. A row
          here means that a text was collected, not that it contains relevant
          evidence. Unscreened or low-value items—including <i>The Strathcona
          Chronicle</i>—do not count toward the passage dataset above. The
          inventory stays visible so exclusions can be audited rather than
          quietly erased.
        </p>
        <div className="mt-6 overflow-x-auto rounded-sm border border-line">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-3 py-2 font-medium">Year</th>
                <th className="px-3 py-2 font-medium">Author</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Topic</th>
                <th className="px-3 py-2 font-medium">Lang.</th>
                <th className="px-3 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {works.map((w, i) => (
                <tr key={i} className="align-top">
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">{w.year}</td>
                  <td className="px-3 py-2 text-ink-soft">{w.creator || "—"}</td>
                  <td className="px-3 py-2 font-serif">{w.title}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-faint">
                    {w.topic.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-faint">
                    {w.language}
                  </td>
                  <td className="px-3 py-2">
                    {w.url ? (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                      >
                        link
                      </a>
                    ) : (
                      <span className="font-mono text-[11px] text-ink-faint">local</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
