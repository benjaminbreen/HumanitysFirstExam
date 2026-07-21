import type { Metadata } from "next";
import { codebook, data } from "@/lib/data";

export const metadata: Metadata = {
  title: `Codebook · ${data.meta.title}`,
  description:
    "The fixed coding frame applied to every cluster and passage, so distributions are comparable across models and topics.",
};

export default function CodebookPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Codebook</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
        Every cluster of model draws and every primary-source passage is
        tagged with codes from this fixed frame, so distributions can be
        counted and compared across models, framings, and topics. Cluster
        labels remain phrases quoted from the samples (the material’s own
        words); codes are the standardized layer on top (the analyst’s
        words). The frame is hand-authored and versioned with the dataset;
        in the full pipeline it is the target schema for the clustering
        step, and revising it means re-coding, not re-writing prose.
      </p>

      <div className="mt-10 space-y-10">
        {codebook.map((branch) => (
          <section key={branch.id} id={branch.id}>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {branch.label}
            </h2>
            <p className="mt-1 text-sm italic text-ink-soft">{branch.question}</p>
            <ul className="mt-4 divide-y divide-line/70 border-y border-line/70">
              {branch.leaves.map((leaf) => (
                <li key={leaf.id} className="grid gap-x-6 gap-y-1 py-3 md:grid-cols-[11rem_1fr]">
                  <span className="font-mono text-sm text-ink">{leaf.label}</span>
                  <span className="text-sm leading-relaxed text-ink-soft">
                    {leaf.definition}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
