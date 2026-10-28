import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { AgreementKey, AgreementTable } from "@/components/Agreement";
import { coders, currentCoder, storage } from "@/lib/coding";
import { addTallies, agentNames, agents, comparison, dashboard, pools, tally } from "@/lib/keys";
import { recordDecisionAction } from "./actions";
import { signOut } from "./auth";
import { SignIn } from "./SignIn";

export const metadata: Metadata = { title: "Position keys", robots: { index: false } };
const link = "text-modern hover:underline";
export default async function KeysPage({ searchParams }: PageProps<"/keys">) {
  const coder = await currentCoder(), query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  const intro = <>
    <PageTitle title="Position keys"><p>A pilot on six questions and 116 passages.</p></PageTitle>
    <ol className="mb-8 max-w-3xl list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
      <li>Ben, Nathan, Opus 5.5 (Medium) and GPT-6.1 Sol (Medium) each sort the passages for all six questions, without seeing each other’s work.</li>
      <li>Ben and Nathan compare their two lists and agree one list per question.</li>
      <li>Only then do the agents’ lists open. Ben and Nathan check how well each agent did.</li>
      <li>Ben and Nathan add any good positions the agents found. That gives the final keys.</li>
    </ol>
  </>;
  if (storage === "none") return <>{intro}<p>Saving is not configured on this site.</p></>;
  if (!coder) return <>{intro}<SignIn next="/keys" error={Boolean(error)} /></>;
  const d = await dashboard();
  const c = d.human ? await comparison() : null;
  const pooled = (a: Parameters<typeof tally>[1][], b: Parameters<typeof tally>[1][]) => addTallies(pools.map((p, i) => tally(p.question, a[i], b[i])));
  const rows = c ? [{ pair: "Ben and Nathan", t: pooled(pools.map((p) => c.ben[p.question]), pools.map((p) => c.nathan[p.question])) }] : [];
  if (c?.runs) for (const a of agents) for (const human of ["ben", "nathan"] as const) rows.push({ pair: `${coders[human].split(" ")[0]} and ${agentNames[a]}`, t: pooled(pools.map((p) => c[human][p.question]), pools.map((p) => c.runs![a]!.sortings[p.question])) });
  return <>
    {intro}
    <div className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px]"><span>Signed in as {coders[coder]}.</span><form action={signOut}><button className={link}>Sign out</button></form></div>
    {error && <p role="alert" className="mb-5 text-period">{error}</p>}
    <p className="mb-5 max-w-3xl text-[15px]">{d.revealed ? "The agents’ lists are open." : d.human ? `Ben and Nathan have agreed ${d.referencesLocked} of 6 joint lists. The agents’ lists stay hidden until all six are agreed.` : d.independentLocked ? "All four have finished sorting." : "Sorting is under way. You can’t see anyone else’s list yet."}</p>
    <div className="overflow-x-auto"><table className="w-full border-t border-rule text-left text-[14px]">
      <thead><tr className="label border-b border-line">{["Question", "Passages", "Ben", "Nathan", "Ben vs Nathan", "Joint list", "Agent check", "Final key"].map((x) => <th key={x} className="py-2 pr-4 font-normal">{x}</th>)}</tr></thead>
      <tbody>{pools.map((p, i) => {
        const s = d.status[i], base = `/keys/${p.question.toLowerCase()}`;
        return <tr key={p.question} className="border-b border-line align-top">
          <td className="py-3 pr-4"><Link href={base} className={link}><span className="mr-2 font-mono text-[12px]">{p.question}</span>{p.text}</Link></td>
          <td className="py-3 pr-4 font-mono">{p.passages.length}</td>
          <td className="py-3 pr-4">{s.benDone ? "Finished" : "In progress"}</td><td className="py-3 pr-4">{s.nathanDone ? "Finished" : "In progress"}</td>
          <td className="py-3 pr-4">{d.human ? <Link href={`${base}/agreement`} className={link}>Open</Link> : "Hidden"}</td>
          <td className="py-3 pr-4">{d.human ? <Link href={`${base}/reference`} className={link}>{s.reference}</Link> : "After sorting"}</td>
          <td className="py-3 pr-4">{d.revealed ? <Link href={`${base}/review`} className={link}>{s.reviews?.every((r) => r.locked) ? "Agreed" : "Open"}</Link> : "Hidden"}</td>
          <td className="py-3 pr-4">{d.revealed && agents.every((a) => d.decisions[a]) && s.reviews?.every((r) => r.locked) ? <Link href={`${base}/final`} className={link}>{s.final}</Link> : "After review"}</td>
        </tr>;
      })}</tbody>
    </table></div>
    <p className="mt-4 text-[14px]">Agents: {agents.map((a) => `${agentNames[a]} ${d.agentReceived[a] ? "finished" : "not run yet"}`).join("; ")}.</p>
    {d.human && <section className="mt-10"><h2 className="label mb-3">Agreement across all six questions</h2><AgreementTable rows={rows} /><AgreementKey /></section>}
    {d.revealed && <section className="mt-10 max-w-3xl"><h2 className="label mb-3 border-b border-rule pb-2">Further use</h2>
      <p className="mb-4 text-[14.5px]">Decide whether to use each agent on the other 34 questions. Keys an agent drafts later are still checked by Ben and Nathan.</p>
      {agents.map((a) => <div key={a} className="mb-6"><h3 className="mb-2 text-[16px]">{agentNames[a]}</h3>{d.decisions[a] ? <p className="whitespace-pre-wrap text-[15px]">{d.decisions[a]!.outcome}: {d.decisions[a]!.reason}</p> : coder === "ben" && d.canDecide ? <form action={recordDecisionAction} className="space-y-2">
        <input type="hidden" name="agent" value={a} /><label className="block text-[14px]">Outcome <select name="outcome" className="ml-2 border border-line bg-bg p-1"><option value="inconclusive">Inconclusive</option><option value="use">Use with historian checks</option><option value="revise">Revise and test on fresh questions</option></select></label>
        <label className="block text-[14px]">Reason<textarea name="reason" required maxLength={6000} rows={3} className="mt-1 block w-full border border-line bg-bg p-2" /></label><button className="border border-rule px-3 py-1.5">Record decision</button>
      </form> : <p className="text-[14px]">{d.canDecide ? "Ben records the decision." : "Waiting for both agent checks to be agreed."}</p>}</div>)}
    </section>}
  </>;
}
