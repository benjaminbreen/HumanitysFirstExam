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
  const title = kind === "reference" ? "joint list" : "final position key";
  const open = d.human && (kind === "reference" || (d.revealed && agents.every((a) => d.decisions[a]) && status.reviews?.every((r) => r.locked)));
  const head = <PageTitle title={`${q}: ${title}`}><p>{pool.text}</p></PageTitle>;
  if (!open) return <>{head}<p>{kind === "reference" ? "This opens when all four have finished sorting." : "This opens after the agent checks for this question are agreed and Ben has recorded whether to use each agent further."} <Link href="/keys" className="text-modern hover:underline">See progress</Link>.</p></>;
  const doc = await jointFor(q, kind);
  return <>
    <p className="mb-4 text-[14px]"><Link href={`/keys/${q.toLowerCase()}/${kind === "reference" ? "agreement" : "review"}`} className="text-modern hover:underline">← {kind === "reference" ? "Ben vs Nathan" : "Agent check"}</Link></p>
    {head}
    {error && <p role="alert" className="mb-4 text-period">{error}</p>}
    <div className="-mt-6 mb-10 max-w-3xl space-y-2 text-[15px] leading-relaxed text-ink-soft">{kind === "reference" ? <>
      <p>Combine your two lists into one. Note how you settled real disagreements. If merging two positions would lose a difference in the argument, keep them separate.</p>
    </> : <>
      <p>Start from your joint list. Add a position only an agent found when you both agree the passages support it, and note which agent proposed it.</p>
    </>}</div>
    {!doc.started ? <form action={startJointAction} className="flex flex-wrap gap-3"><input type="hidden" name="q" value={q} /><input type="hidden" name="kind" value={kind} />
      {kind === "reference" ? <><button name="from" value="ben" className="border border-rule px-3 py-1.5">Start from Ben’s list</button><button name="from" value="nathan" className="border border-rule px-3 py-1.5">Start from Nathan’s list</button></> : <button name="from" value="ben" className="border border-rule px-3 py-1.5">Start from the joint list</button>}
    </form> : <JointEditor q={q} kind={kind} passages={pool.passages} initial={doc} labels={directionLabels(q)} me={coder} max={MAX_POSITIONS} />}
  </>;
}
