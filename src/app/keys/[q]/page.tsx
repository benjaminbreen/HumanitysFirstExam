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
          Read all {pool.passages.length} passages. Then add a position for each different answer you find. A position
          has two parts: the claim (what the writer says the answer is) and the reason (why they say it). If two
          writers reach the same answer for different reasons, give them separate positions. Then add each passage to
          the positions it supports. A passage can support more than one.
        </p>
        <p>
          Where the passages come from: we searched the full texts of the 204 works on our{" "}
          <Link href="/sources" className="text-modern hover:underline">source list</Link> for passages about this
          question. Claude read the 45 closest matches and kept the ones that discuss the question, whatever answer
          they give. The text is copied exactly from the source, with scanning errors fixed.
        </p>
        <p>
          Claude has written its own list of positions from the same passages. You see it only after you tick “I have
          finished this question” at the bottom. Your work saves automatically.
        </p>
      </div>
      <Board q={q} passages={pool.passages} initial={sorting} />
    </>
  );
}
