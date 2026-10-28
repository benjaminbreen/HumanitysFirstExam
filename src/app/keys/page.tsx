import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { AgreementKey, AgreementTable } from "@/components/Agreement";
import { coders, currentCoder, storage } from "@/lib/coding";
import { addTallies, agentNames, agents, comparison, dashboard, pools, tally } from "@/lib/keys";
import { recordDecisionAction, recordRuleAction } from "./actions";
import { signOut } from "./auth";
import { SignIn } from "./SignIn";

export const metadata: Metadata = { title: "Position keys", robots: { index: false } };
const link = "text-modern hover:underline";
export default async function KeysPage({ searchParams }: PageProps<"/keys">) {
  const coder = await currentCoder(), query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  const intro = <>
    <PageTitle title="Position keys"><p>Two historians and two agents build position keys for six questions from 116 supplied passages. This is a pilot.</p></PageTitle>
    <ol className="mb-8 max-w-3xl list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
      <li>Ben, Nathan, Opus 5.5 (Medium) and GPT-6.1 Sol (Medium) sort all six questions independently under the same written instructions.</li>
      <li>After all four finish and Ben records the evaluation rule, only the Ben–Nathan comparison opens.</li>
      <li>Ben and Nathan make and lock their human reference lists. All agent results stay hidden until all six references are locked by both historians.</li>
      <li>Then compare each agent’s sorting and review its category meanings against the saved human references.</li>
      <li>Record further-use decisions, add any supported discoveries both historians accept, and freeze the final keys before reading benchmark answers.</li>
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
    <p className="mb-5 max-w-3xl text-[15px]">{d.revealed ? "All human references are locked. Agent results and definition reviews are open." : d.human ? `${d.referencesLocked} of 6 human references locked. All agent results remain hidden.` : d.independentLocked ? "Independent sorting is locked. Record the evaluation rule to open the human comparison." : "Independent sorting is in progress. Other lists and comparisons remain hidden."}</p>
    <div className="overflow-x-auto"><table className="w-full border-t border-rule text-left text-[14px]">
      <thead><tr className="label border-b border-line">{["Question", "Passages", "Ben", "Nathan", "Human comparison", "Human reference", "Agent review", "Final key"].map((x) => <th key={x} className="py-2 pr-4 font-normal">{x}</th>)}</tr></thead>
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
    <p className="mt-4 text-[14px]">Independent runs: {agents.map((a) => `${agentNames[a]} ${d.agentReceived[a] ? "recorded" : "not yet recorded"}`).join("; ")}. Run contents stay hidden until the human references lock.</p>
    <section className="mt-10 max-w-3xl">
      <h2 className="label mb-3 border-b border-rule pb-2">Evaluation rule</h2>
      <p className="mb-3 text-[14.5px]">Choose the acceptable shortfall from human agreement and how definition errors affect further use before any scores are revealed. The rule becomes fixed when the human comparison opens. No automatic pass is calculated.</p>
      {d.rule && <p className="mb-3 whitespace-pre-wrap text-[15px]">{d.rule.text}</p>}
      {coder === "ben" && !d.human && <form action={recordRuleAction} className="space-y-3">
        <input type="hidden" name="version" value={d.rule?.version ?? 0} />
        <label className="block text-[14px]">Rule<textarea name="rule" required maxLength={6000} rows={5} defaultValue={d.rule?.text ?? ""} className="mt-1 block w-full border border-line bg-bg p-2" /></label>
        <button className="border border-rule px-3 py-1.5">Record rule</button>
      </form>}
      {!d.rule && coder !== "ben" && <p className="text-[14px]">Ben has not recorded the rule. Independent sorting can continue.</p>}
    </section>
    {d.human && <section className="mt-10"><h2 className="label mb-3">Agreement across all six questions</h2><AgreementTable rows={rows} /><AgreementKey /><p className="mt-2 text-[13px] text-ink-soft">Totals sum passage pairs and direction judgments across questions. Questions with more eligible pairs have more weight.</p></section>}
    {d.revealed && <section className="mt-10 max-w-3xl"><h2 className="label mb-3 border-b border-rule pb-2">Further use</h2>
      <p className="mb-4 text-[14.5px]">After both historians agree all definition reviews, apply the recorded rule to each agent separately. Any further keys still receive historian checks.</p>
      {agents.map((a) => <div key={a} className="mb-6"><h3 className="mb-2 text-[16px]">{agentNames[a]}</h3>{d.decisions[a] ? <p className="whitespace-pre-wrap text-[15px]">{d.decisions[a]!.outcome}: {d.decisions[a]!.reason}</p> : coder === "ben" && d.canDecide ? <form action={recordDecisionAction} className="space-y-2">
        <input type="hidden" name="agent" value={a} /><label className="block text-[14px]">Outcome <select name="outcome" className="ml-2 border border-line bg-bg p-1"><option value="inconclusive">Inconclusive</option><option value="use">Use with historian checks</option><option value="revise">Revise and test on fresh questions</option></select></label>
        <label className="block text-[14px]">How the rule applies<textarea name="reason" required maxLength={6000} rows={3} className="mt-1 block w-full border border-line bg-bg p-2" /></label><button className="border border-rule px-3 py-1.5">Record decision</button>
      </form> : <p className="text-[14px]">{d.canDecide ? "Ben records the decision." : "Waiting for all definition reviews to be agreed."}</p>}</div>)}
    </section>}
  </>;
}
