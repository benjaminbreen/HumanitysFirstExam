import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { KeyInstructions } from "@/components/KeyInstructions";
import { coders, currentCoder, storage } from "@/lib/coding";
import { directionLabels, getPool, MAX_POSITIONS, sortingFor } from "@/lib/keys";
import { SignIn } from "../SignIn";
import { Board } from "./Board";

export const metadata: Metadata = { title: "Independent sorting", robots: { index: false } };
export default async function KeyQuestionPage({ params, searchParams }: PageProps<"/keys/[q]">) {
  const q = (await params).q.toUpperCase(), pool = getPool(q);
  if (!pool) notFound();
  const coder = await currentCoder(), error = Boolean((await searchParams).error);
  const head = <PageTitle title={`${q}: independent sorting`}><p className="text-ink">{pool.text}</p></PageTitle>;
  if (storage === "none") return <>{head}<p>Saving is not configured.</p></>;
  if (!coder) return <>{head}<SignIn next={`/keys/${q.toLowerCase()}`} error={error} /></>;
  const { sorting, locked } = await sortingFor(q);
  return <>
    <p className="mb-4 text-[14px]"><Link href="/keys" className="text-modern hover:underline">← All questions</Link><span className="ml-4 text-ink-faint">{coders[coder]}</span></p>
    {head}
    <div className="-mt-6 mb-10 max-w-3xl space-y-3">
      <KeyInstructions />
      <p className="text-[14px] text-ink-soft">These instructions are shared by both historians and both agents. Work saves automatically. All independent sortings lock together after all four sorters finish all six questions. Agent results remain hidden until both historians lock all six human reference lists.</p>
      {sorting.savedAt && sorting.version === 0 && <p className="text-[14px] text-provisional">Your earlier entries were preserved as a draft. Review them under the shared instructions before marking this question finished.</p>}
    </div>
    <Board q={q} passages={pool.passages} initial={sorting} labels={directionLabels(q)} locked={locked} max={MAX_POSITIONS} />
  </>;
}
