import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { currentCoder } from "@/lib/coding";
import { bothDone, complete, directionLabels, finalFor, getPool, MAX_POSITIONS } from "@/lib/keys";
import { startFinalAction } from "../../actions";
import { FinalEditor } from "./FinalEditor";

export const metadata: Metadata = { title: "Final list", robots: { index: false } };

export default async function FinalPage({ params }: PageProps<"/keys/[q]/final">) {
  const q = (await params).q.toUpperCase();
  const pool = getPool(q);
  if (!pool) notFound();
  const coder = await currentCoder();
  if (!coder) redirect(`/keys/${q.toLowerCase()}`);
  if (!(await bothDone(q))) redirect(`/keys/${q.toLowerCase()}/agreement`);
  const final = await finalFor(q);

  return (
    <>
      <p className="mb-4 text-[14px]">
        <Link href={`/keys/${q.toLowerCase()}/agreement`} className="text-modern hover:underline">← {q} agreement</Link>
      </p>
      <PageTitle title={`${q}: final list`}>
        <p className="text-ink">{pool.text}</p>
      </PageTitle>
      <div className="-mt-6 mb-10 max-w-3xl space-y-2 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Ben and Nathan merge their two lists into this one. It is what readers of the site see, and model answers
          are later matched against it. Settle each difference together and say how in the position’s note. Where you
          disagree on whether two positions are one, split them if merging would lose a difference in the argument.
        </p>
        <p>
          Claude’s list is not a source for this list. When yours is done, check Claude’s list on the{" "}
          <Link href={`/keys/${q.toLowerCase()}/agreement`} className="text-modern hover:underline">agreement page</Link>{" "}
          for positions neither of you had. Add one only if you both agree a passage states it, and note “first
          proposed by Claude”.
        </p>
      </div>
      {!final.categories.length && !final.frozenAt ? (
        <form action={startFinalAction} className="flex flex-wrap gap-3">
          <input type="hidden" name="q" value={q} />
          <button name="from" value="ben" className="border border-rule px-3 py-1.5 hover:bg-surface">Start from Ben’s list</button>
          <button name="from" value="nathan" className="border border-rule px-3 py-1.5 hover:bg-surface">Start from Nathan’s list</button>
        </form>
      ) : null}
      {(final.categories.length > 0 || final.frozenAt) && (
        <FinalEditor q={q} passages={pool.passages} initial={final} labels={directionLabels(q)} me={coder} complete={complete(q, final)} max={MAX_POSITIONS} />
      )}
    </>
  );
}
