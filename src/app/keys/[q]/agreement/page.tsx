import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AgreementKey, AgreementTable } from "@/components/Agreement";
import { PageTitle } from "@/components/PageTitle";
import { coders, currentCoder } from "@/lib/coding";
import { claudeSorting, directionLabels, getPool, sortingFor, tally, type Sorting } from "@/lib/keys";

export const metadata: Metadata = { title: "Agreement", robots: { index: false } };

const num = (id: string) => String(Number(id.replace(/\D/g, "")));

export default async function AgreementPage({ params }: PageProps<"/keys/[q]/agreement">) {
  const q = (await params).q.toUpperCase();
  const pool = getPool(q);
  if (!pool) notFound();
  const coder = await currentCoder();
  if (!coder) redirect(`/keys/${q.toLowerCase()}`);
  const [ben, nathan] = await Promise.all([sortingFor("ben", q), sortingFor("nathan", q)]);
  const back = <Link href={`/keys/${q.toLowerCase()}`} className="text-modern hover:underline">← {q} passages</Link>;
  if (!ben.done || !nathan.done) {
    return (
      <>
        <p className="mb-4 text-[14px]">{back}</p>
        <PageTitle title={`${q}: agreement`}>
          <p>
            Opens when Ben and Nathan have both finished this question. Ben: {ben.done ? "finished" : "not finished"}.
            Nathan: {nathan.done ? "finished" : "not finished"}.
          </p>
        </PageTitle>
      </>
    );
  }
  const claude = claudeSorting(q);
  const labels = directionLabels(q);
  const lists: { who: string; tag: string; s: Sorting }[] = [
    { who: coders.ben, tag: "B", s: ben },
    { who: coders.nathan, tag: "N", s: nathan },
    { who: "Claude", tag: "C", s: claude },
  ];
  const at = (s: Sorting, tag: string, pid: string) => {
    const i = s.categories.findIndex((c) => c.passages.includes(pid));
    if (i >= 0) return `${tag}${i + 1} ${labels[s.categories[i].direction ?? "other"]}`;
    return s.off.includes(pid) ? "Off" : s.unclear.includes(pid) ? "Unclear" : "–";
  };

  return (
    <>
      <p className="mb-4 text-[14px]">{back}</p>
      <PageTitle title={`${q}: agreement`}>
        <p className="text-ink">{pool.text}</p>
      </PageTitle>
      <section className="-mt-6 mb-12">
        <AgreementTable
          rows={[
            { pair: "Ben and Nathan", t: tally(q, ben, nathan) },
            { pair: "Ben and Claude", t: tally(q, ben, claude) },
            { pair: "Nathan and Claude", t: tally(q, nathan, claude) },
          ]}
        />
        <AgreementKey />
        <p className="mt-3 max-w-3xl text-[14.5px]">
          One question is too few passages to judge by. The figures across all six are on the{" "}
          <Link href="/keys" className="text-modern hover:underline">keys page</Link>. Next:{" "}
          <Link href={`/keys/${q.toLowerCase()}/final`} className="text-modern hover:underline">make the final list →</Link>
        </p>
      </section>

      <section className="mb-12">
        <h2 className="label mb-3 border-b border-rule pb-2">Each passage</h2>
        <table className="w-full text-left text-[14.5px]">
          <thead>
            <tr className="label border-b border-line">
              <th className="py-2 pr-4 font-normal">Passage</th>
              {lists.map((l) => <th key={l.tag} className="py-2 pr-4 font-normal">{l.who.split(" ")[0]}</th>)}
            </tr>
          </thead>
          <tbody>
            {pool.passages.map((p) => (
              <tr key={p.id} className="border-b border-line align-baseline">
                <td className="py-1.5 pr-4">
                  <a href={`/keys/${q.toLowerCase()}#${p.id}`} className="hover:underline">
                    <span className="num font-mono text-[12px] text-ink-faint">{num(p.id)}</span> {p.author}
                  </a>
                </td>
                {lists.map((l) => <td key={l.tag} className="py-1.5 pr-4 font-mono text-[13px]">{at(l.s, l.tag, p.id)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        {lists.map((l) => (
          <div key={l.tag}>
            <h2 className="label mb-3 border-b border-rule pb-2">{l.who}: {l.s.categories.length} positions</h2>
            <ol className="space-y-4">
              {l.s.categories.map((c, i) => (
                <li key={c.id} className="text-[14.5px]">
                  <p>
                    <span className="mr-2 font-mono text-[13px] font-semibold">{l.tag}{i + 1}</span>
                    <span className="font-mono text-[12px] text-ink-faint">{labels[c.direction ?? "other"]}</span>
                  </p>
                  <p className="text-ink">{c.claim}</p>
                  <p className="text-ink-soft">{c.reason}</p>
                  <p className="num font-mono text-[12px] text-ink-faint">Passages {c.passages.map(num).join(", ")}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </>
  );
}
