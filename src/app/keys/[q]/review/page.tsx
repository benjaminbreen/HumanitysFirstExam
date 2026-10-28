import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { currentCoder } from "@/lib/coding";
import { agents, agentNames, dashboard, directionLabels, emptyReview, getPool, reviewCounts, reviewFor } from "@/lib/keys";
import { approveReviewAction, saveReviewAction, withdrawReviewAction } from "../../actions";

export const metadata: Metadata = { title: "Agent definition review", robots: { index: false } };
const control = "border border-line bg-bg p-1.5 text-[14px]";
export default async function ReviewPage({ params, searchParams }: PageProps<"/keys/[q]/review">) {
  const q = (await params).q.toUpperCase(), pool = getPool(q), query = await searchParams;
  if (!pool) notFound();
  const coder = await currentCoder();
  if (!coder) redirect(`/keys/${q.toLowerCase()}`);
  const d = await dashboard();
  const head = <PageTitle title={`${q}: agent definition review`}><p>{pool.text}</p></PageTitle>;
  if (!d.revealed) return <>{head}<p>All agent results stay hidden until both historians lock all six human reference lists. <Link href="/keys" className="text-modern hover:underline">See progress</Link>.</p></>;
  const data = await reviewFor(q), labels = directionLabels(q);
  return <>
    <p className="mb-4 text-[14px]"><Link href={`/keys/${q.toLowerCase()}/agreement`} className="text-modern hover:underline">← Sorting comparisons</Link></p>{head}
    {typeof query.error === "string" && <p role="alert" className="mb-5 text-period">{query.error}</p>}
    <p className="-mt-6 mb-8 max-w-3xl text-[15px] leading-relaxed text-ink-soft">Judge each agent separately against the locked human reference. A match needs the same conclusion and the same reason. Mark a broad category as recovering distinct positions only when it preserves their distinct arguments. Explain resolved judgments; leave uncertain ones unresolved. Save changes before agreeing. Both historians must agree to the same saved review.</p>
    {agents.map((a) => {
      const run = data.runs[a], r = data.reviews[a] ?? emptyReview(), count = reviewCounts(q, data.reference, run, r);
      return <section key={a} className="mb-12 border-t border-rule pt-4">
        <h2 className="mb-2 text-[20px]">{agentNames[a]}</h2>
        <p className="mb-2 text-[13px] text-ink-soft">Model: {run.model}. Run: {run.createdAt}. Settings: {JSON.stringify(run.settings)}. Exposure note: {run.exposureNote || "None recorded"}.</p>
        {r.frozenAt ? <p className="mb-4 text-[14px]">Agreed by both historians: {count.recovered} of {count.total} reference positions recovered; {count.missed} missed; {count.unresolved} unresolved. Agent positions: {count.unsupported} unsupported; {count.discoveries} supported discoveries; {count.agentUnresolved} unresolved.</p> : <p className="mb-4 text-[14px] text-ink-soft">Draft review. Counts become agreed results when both historians approve it.</p>}
        <form action={saveReviewAction} className="space-y-6">
          <input type="hidden" name="q" value={q} /><input type="hidden" name="agent" value={a} /><input type="hidden" name="version" value={r.version} />
          <fieldset disabled={Boolean(r.frozenAt)} className="space-y-4">
            <legend className="label mb-3">Human reference positions</legend>
            {data.reference.categories.map((c, i) => <div key={c.id} className="border-b border-line pb-4">
              <p className="text-[15px]"><span className="mr-2 font-mono text-[12px]">H{i + 1} · {labels[c.direction!]}</span>{c.claim}</p><p className="mb-2 text-[14px] text-ink-soft">{c.reason}</p>
              <div className="flex flex-wrap gap-3"><label className="text-[13px]">Judgment <select name={`ref-status:${c.id}`} defaultValue={r.reference[c.id]?.status ?? "unresolved"} className={control}><option value="unresolved">Unresolved</option><option value="recovered">Recovered</option><option value="missed">Missed</option></select></label>
                <label className="text-[13px]">Matching agent IDs <input name={`ref-matches:${c.id}`} defaultValue={r.reference[c.id]?.matches.join(", ") ?? ""} placeholder="e.g. k1, k3" className={`${control} w-40`} /></label></div>
              <label className="mt-2 block text-[13px]">Reason for this judgment<textarea name={`ref-note:${c.id}`} defaultValue={r.reference[c.id]?.note ?? ""} maxLength={3000} rows={2} className={`${control} mt-1 block w-full`} /></label>
            </div>)}
          </fieldset>
          <fieldset disabled={Boolean(r.frozenAt)} className="space-y-4"><legend className="label mb-3">Agent positions</legend>
            {run.sortings[q].categories.map((c) => <div key={c.id} className="border-b border-line pb-4"><p className="text-[15px]"><span className="mr-2 font-mono text-[12px]">{c.id} · {labels[c.direction!]}</span>{c.claim}</p><p className="text-[14px] text-ink-soft">{c.reason}</p><p className="my-2 text-[12px] font-mono">Passages: {c.passages.map((id) => <Link key={id} href={`/keys/${q.toLowerCase()}#${id}`} className="mr-2 text-modern hover:underline">{id}</Link>)}</p>
              <label className="text-[13px]">Judgment <select name={`cat-status:${c.id}`} defaultValue={r.categories[c.id]?.status ?? "unresolved"} className={control}><option value="unresolved">Unresolved</option><option value="supported">Supported</option><option value="unsupported">Unsupported by the passages</option><option value="discovery">Supported agent-only discovery</option></select></label>
              <label className="mt-2 block text-[13px]">Supporting passage IDs and explanation<textarea name={`cat-note:${c.id}`} defaultValue={r.categories[c.id]?.note ?? ""} maxLength={3000} rows={2} className={`${control} mt-1 block w-full`} /></label>
            </div>)}
          </fieldset>
          <label className="block text-[13px]">Merges, splits, misreadings and unresolved differences<textarea name="notes" defaultValue={r.notes} disabled={Boolean(r.frozenAt)} maxLength={3000} rows={3} className={`${control} mt-1 block w-full`} /></label>
          {!r.frozenAt && <div className="flex flex-wrap items-center gap-3"><button className="border border-rule px-3 py-1.5">Save review</button>
            <button formAction={r.agreed[coder] ? withdrawReviewAction : approveReviewAction} disabled={!r.version} className="border border-rule px-3 py-1.5 disabled:opacity-40">{r.agreed[coder] ? "Withdraw my agreement" : "I agree to this saved review"}</button>
            <span className="text-[13px]">Ben {r.agreed.ben ? "agreed" : "has not agreed"}; Nathan {r.agreed.nathan ? "agreed" : "has not agreed"}.</span></div>}
        </form>
      </section>;
    })}
    <p className="text-[15px]"><Link href="/keys" className="text-modern hover:underline">Record further-use decisions on the keys page</Link>. Then <Link href={`/keys/${q.toLowerCase()}/final`} className="text-modern hover:underline">make the final position key</Link>.</p>
  </>;
}
