import type { Metadata } from "next";
import Link from "next/link";
import SourcePassageCard from "@/components/SourcePassageCard";
import { data, works } from "@/lib/data";

export const metadata: Metadata = {
  title: `Sources · ${data.meta.title}`,
  description:
    "Primary-source passages cited in the worked examples, and the 1860–1930 holdings of the historical corpus.",
};

export default function SourcesPage() {
  const passages = data.topics.flatMap((t) =>
    t.passages.map((p) => ({ ...p, topicSlug: t.slug, topicTitle: t.title })),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Sources</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
        Two layers. First, the passages cited on the worked topic pages — each
        with its citation, a link to a readable copy, and a badge stating
        whether the text was checked verbatim against a local full text.
        Second, the current 1860–1930 holdings of the historical corpus
        (full texts on disk, assembled for an earlier corpus project), from
        which grounding passages are drawn.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Passages cited in the worked examples
        </h2>
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
          Historical corpus holdings, 1860–1930
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          {works.length} works with full text on disk, organized by search
          topic; English, French, German, Italian, and Russian. A further
          collection (the Jamesiana texts) supplies the complete works of
          William James, including <i>The Principles of Psychology</i> (1890).
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
