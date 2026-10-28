import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AgreementKey, AgreementTable } from "@/components/Agreement";
import { PageTitle } from "@/components/PageTitle";
import { currentCoder } from "@/lib/coding";
import { agents, agentNames, comparison, dashboard, directionLabels, getPool, tally, type Sorting } from "@/lib/keys";

export const metadata: Metadata = { title: "Agreement", robots: { index: false } };
export default async function AgreementPage({ params }: PageProps<"/keys/[q]/agreement">) {
  const q = (await params).q.toUpperCase(), pool = getPool(q);
  if (!pool) notFound();
  if (!(await currentCoder())) redirect(`/keys/${q.toLowerCase()}`);
  const d = await dashboard();
  const head = <PageTitle title={`${q}: agreement`}><p>{pool.text}</p></PageTitle>;
  if (!d.human) return <>{head}<p>This opens when all four have finished sorting and Ben has written the pass mark. <Link href="/keys" className="text-modern hover:underline">See progress</Link>.</p></>;
  // No agent records are returned by this server accessor until every human reference locks.
  const c = await comparison(q), labels = directionLabels(q);
  const lists: { who: string; tag: string; s: Sorting }[] = [{ who: "Ben", tag: "B", s: c.ben[q] }, { who: "Nathan", tag: "N", s: c.nathan[q] }];
  const rows = [{ pair: "Ben and Nathan", t: tally(q, c.ben[q], c.nathan[q]) }];
  if (c.runs) for (const a of agents) {
    const s = c.runs[a]!.sortings[q];
    lists.push({ who: agentNames[a], tag: a === "opus" ? "O" : "S", s });
    rows.push({ pair: `Ben and ${agentNames[a]}`, t: tally(q, c.ben[q], s) }, { pair: `Nathan and ${agentNames[a]}`, t: tally(q, c.nathan[q], s) });
  }
  const at = (s: Sorting, tag: string, id: string) => {
    const i = s.categories.findIndex((cat) => cat.passages.includes(id));
    return i >= 0 ? `${tag}${i + 1} ${labels[s.categories[i].direction!]}` : s.off.includes(id) ? "Off" : "Unclear";
  };
  return <>
    <p className="mb-4 text-[14px]"><Link href="/keys" className="text-modern hover:underline">← All questions</Link></p>{head}
    <section className="-mt-6 mb-10"><AgreementTable rows={rows} /><AgreementKey />
      <p className="mt-3 text-[14.5px]">{d.revealed ? <Link href={`/keys/${q.toLowerCase()}/review`} className="text-modern hover:underline">Check the agents →</Link> : <>The agents’ results stay hidden for now. <Link href={`/keys/${q.toLowerCase()}/reference`} className="text-modern hover:underline">Make the joint list →</Link></>}</p>
    </section>
    <section className="mb-10 overflow-x-auto"><h2 className="label mb-3">Each passage</h2><table className="w-full text-left text-[14px]"><thead><tr className="label border-b border-rule"><th className="py-2 pr-4 font-normal">Passage</th>{lists.map((l) => <th key={l.tag} className="py-2 pr-4 font-normal">{l.who}</th>)}</tr></thead><tbody>
      {pool.passages.map((p) => <tr key={p.id} className="border-b border-line"><td className="py-2 pr-4"><Link href={`/keys/${q.toLowerCase()}#${p.id}`} className="hover:underline">{p.id} {p.author}</Link></td>{lists.map((l) => <td key={l.tag} className="py-2 pr-4 font-mono text-[12px]">{at(l.s, l.tag, p.id)}</td>)}</tr>)}
    </tbody></table></section>
    <section className="grid gap-8 lg:grid-cols-2">{lists.map((l) => <div key={l.tag}><h2 className="label mb-3 border-b border-rule pb-2">{l.who}: {l.s.categories.length} positions</h2><ol className="space-y-4">{l.s.categories.map((cat, i) => <li key={cat.id} className="text-[14.5px]"><p className="font-mono text-[12px]">{l.tag}{i + 1} · {labels[cat.direction!]}</p><p>{cat.claim}</p><p className="text-ink-soft">{cat.reason}</p><p className="font-mono text-[12px] text-ink-faint">{cat.passages.join(", ")}</p></li>)}</ol></div>)}</section>
  </>;
}
