import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { coders, currentCoder, storage } from "@/lib/coding";
import { getPool, sortingFor } from "@/lib/keys";
import { SignIn } from "../SignIn";
import { Board } from "./Board";

export const metadata: Metadata = { title: "Position key", robots: { index: false } };

export default async function KeyQuestionPage({ params, searchParams }: PageProps<"/keys/[q]">) {
  const q = (await params).q.toUpperCase();
  const pool = getPool(q);
  if (!pool) notFound();
  const coder = await currentCoder();
  const error = Boolean((await searchParams).error);

  const head = (
    <PageTitle title={q}>
      <p className="text-ink">{pool.text}</p>
    </PageTitle>
  );
  if (storage === "none") return <>{head}<p>Saving is not set up on this site yet.</p></>;
  if (!coder) return <>{head}<SignIn next={`/keys/${q.toLowerCase()}`} error={error} /></>;

  const sorting = await sortingFor(coder, q);
  return (
    <>
      <p className="mb-4 text-[14px]">
        <Link href="/keys" className="text-modern hover:underline">← All questions</Link>
        <span className="ml-4 text-ink-faint">{coders[coder]}</span>
      </p>
      {head}
      <div className="-mt-6 mb-10 max-w-3xl space-y-2 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Read all {pool.passages.length} passages first. Then write each distinct answer you find as a position: the
          claim, and the reason that sets it apart. Split two positions when they reach the same conclusion by
          different reasoning. Add every passage that supports a position; a passage can support more than one.
        </p>
        <p>
          Passages were chosen by Claude agents from the{" "}
          <Link href="/sources" className="text-modern hover:underline">accepted canon</Link> for addressing the question, without regard to which
          answer they give. Excerpts are verbatim with OCR damage repaired. Claude’s positions stay hidden until you
          mark the question finished. Changes save as you go.
        </p>
      </div>
      <Board q={q} passages={pool.passages} initial={sorting} />
    </>
  );
}
