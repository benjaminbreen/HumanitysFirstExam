import type { Metadata } from "next";
import { FaceToggle } from "@/components/FaceToggle";
import { PageTitle } from "@/components/PageTitle";
import { models, type Model } from "@/lib/data";

export const metadata: Metadata = { title: "Models" };

const kindLabel = {
  historical: "Historical",
  base: "Modern base",
  instruct: "Open, instruction-tuned",
  deployed: "Deployed",
} as const;

const groups = [
  {
    role: "core",
    title: "Core comparison",
    text: "The pilot compares these two base models: the same architecture and training compute, one trained on pre-1931 text and one on modern web text. The two training sets differ in the kinds of text they contain as well as in date.",
  },
  {
    role: "context",
    title: "Context",
    text: "Also run in the pilot, for comparison and for the public site. We plan to add one deployed frontier model to this group.",
  },
  { role: "candidate", title: "Candidates", text: "Models we may add later." },
] as const;

export default function ModelsPage() {
  return (
    <>
      <PageTitle title="Models">
        <p>The models that answer the benchmark questions.</p>
      </PageTitle>
      <div className="space-y-14">
        {groups.map((g) => (
          <section key={g.role}>
            <h2 className="mb-4 font-pixel text-[24px] leading-none">
              <FaceToggle>{g.title}</FaceToggle>
            </h2>
            <p className="mb-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{g.text}</p>
            <ModelTable models={models.filter((m) => m.role === g.role)} />
          </section>
        ))}
      </div>
    </>
  );
}

function ModelTable({ models }: { models: Model[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-rule">
          <th scope="col" className="pb-3 pr-6 label font-normal">Model</th>
          <th scope="col" className="pb-3 pr-6 label font-normal">Kind</th>
          <th scope="col" className="hidden pb-3 pr-6 label font-normal sm:table-cell">Cutoff</th>
          <th scope="col" className="hidden pb-3 pr-6 label font-normal sm:table-cell">Size</th>
          <th scope="col" className="hidden pb-3 pr-6 label font-normal md:table-cell">Access</th>
          <th scope="col" className="pb-3 label font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {models.map((m) => (
          <tr key={m.id} className="border-b border-line align-baseline">
            <td className="py-3.5 pr-6">
              <div className="text-[1.05rem] font-medium">{m.name}</div>
              <div className="text-[0.95rem] text-ink-soft">{m.maker}</div>
              {m.note && <div className="mt-1 max-w-md text-[13.5px] leading-snug text-ink-faint">{m.note}</div>}
            </td>
            <td className="py-3.5 pr-6 text-[0.95rem] text-ink-soft">{kindLabel[m.kind]}</td>
            <td className="num hidden py-3.5 pr-6 font-mono text-xs text-ink-soft sm:table-cell">{m.cutoff ?? "—"}</td>
            <td className="num hidden py-3.5 pr-6 font-mono text-xs text-ink-soft sm:table-cell">{m.params}</td>
            <td className="hidden py-3.5 pr-6 text-[0.95rem] text-ink-soft md:table-cell">{m.access}</td>
            <td
              className={`py-3.5 font-mono text-xs ${m.status === "piloted" || m.status === "run" ? "text-provisional" : "text-ink-faint"}`}
            >
              {m.status}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
