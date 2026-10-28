import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { currentCoder } from "@/lib/coding";
import { agents, dashboard, directionLabels, getPool, jointFor, MAX_POSITIONS, type JointKind } from "@/lib/keys";
import { startJointAction } from "../actions";
import { JointEditor } from "./JointEditor";

export async function JointPage({ q, kind, error }: { q: string; kind: JointKind; error?: string }) {
  const pool = getPool(q);
  if (!pool) notFound();
  const coder = await currentCoder();
  if (!coder) redirect(`/keys/${q.toLowerCase()}`);
  const d = await dashboard(), status = d.status.find((p) => p.question === q)!;
  const title = kind === "reference" ? "human reference" : "final position key";
  const open = d.human && (kind === "reference" || (d.revealed && agents.every((a) => d.decisions[a]) && status.reviews?.every((r) => r.locked)));
  const head = <PageTitle title={`${q}: ${title}`}><p>{pool.text}</p></PageTitle>;
  if (!open) return <>{head}<p>{kind === "reference" ? "Finish all independent sortings and record the evaluation rule before making the human reference." : "Lock all human references, agree both definition reviews for this question, and record both further-use decisions before making the final key."} <Link href="/keys" className="text-modern hover:underline">See progress</Link>.</p></>;
  const doc = await jointFor(q, kind);
  return <>
    <p className="mb-4 text-[14px]"><Link href={`/keys/${q.toLowerCase()}/${kind === "reference" ? "agreement" : "review"}`} className="text-modern hover:underline">← {kind === "reference" ? "Human comparison" : "Agent definition review"}</Link></p>
    {head}
    {error && <p role="alert" className="mb-4 text-period">{error}</p>}
    <div className="-mt-6 mb-10 max-w-3xl space-y-2 text-[15px] leading-relaxed text-ink-soft">{kind === "reference" ? <>
      <p>Combine your two independent lists. Settle differences together and record important decisions in the notes. Split positions when merging would lose a difference in the argument.</p>
      <p>This human-only reference is saved separately. Agent scores, groupings and category text remain hidden until both historians lock all six references.</p>
    </> : <>
      <p>Start from your locked human reference. Add agent-only positions only when both historians accept the supporting passages. Record which agent first proposed each addition in its note.</p>
      <p>Your human reference and the original sortings stay unchanged. Both historians agree to the same final version before anyone reads the benchmark answers.</p>
    </>}</div>
    {!doc.started ? <form action={startJointAction} className="flex flex-wrap gap-3"><input type="hidden" name="q" value={q} /><input type="hidden" name="kind" value={kind} />
      {kind === "reference" ? <><button name="from" value="ben" className="border border-rule px-3 py-1.5">Start from Ben’s list</button><button name="from" value="nathan" className="border border-rule px-3 py-1.5">Start from Nathan’s list</button></> : <button name="from" value="ben" className="border border-rule px-3 py-1.5">Start from the human reference</button>}
    </form> : <JointEditor q={q} kind={kind} passages={pool.passages} initial={doc} labels={directionLabels(q)} me={coder} max={MAX_POSITIONS} />}
  </>;
}
