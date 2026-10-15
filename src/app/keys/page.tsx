import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { coders, currentCoder, storage, type Coder } from "@/lib/coding";
import { pools, sortingsFor } from "@/lib/keys";
import { signOut } from "../coding/actions";
import { SignIn } from "./SignIn";

export const metadata: Metadata = { title: "Position keys", robots: { index: false } };

export default async function KeysPage({ searchParams }: PageProps<"/keys">) {
  const coder = await currentCoder();
  const error = Boolean((await searchParams).error);
  const intro = (
    <>
      <PageTitle title="Position keys">
        <p>
          A position key lists the distinct answers period writers gave to a question. Model answers are later
          scored against it. These pages build the keys for the six pilot questions. This is a prototype.
        </p>
      </PageTitle>
      <ol className="mb-10 max-w-3xl list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
        <li>
          <span className="text-ink">Pool.</span> Every chunk of the accepted canon’s texts is ranked by similarity to
          the question. Claude agents read the top 45 in context and keep the 15–21 that address the question,
          whatever answer they give, at most two per work. Excerpts are checked verbatim against the source files.
        </li>
        <li>
          <span className="text-ink">Independent reading.</span> A historian reads the pool and writes each distinct
          answer as a position: a claim, the reason that sets it apart, and the passages that support it. Claude
          does the same task separately, without seeing the historian’s work.
        </li>
        <li>
          <span className="text-ink">Comparison.</span> When the historian finishes, the two lists are shown side by
          side. Shared passages suggest pairings; the historian decides for each pair whether the claims and reasons
          are the same argument, and which positions enter the key.
        </li>
        <li>
          <span className="text-ink">Freeze.</span> The reconciled key is fixed before any model answer is read.
          Claude then codes the model answers against it, and the historians code a blind sample to check Claude’s
          coding.
        </li>
      </ol>
    </>
  );
  if (storage === "none") return <>{intro}<p>Saving is not set up on this site yet.</p></>;
  if (!coder) return <>{intro}<SignIn next="/keys" error={error} /></>;

  const all = Object.fromEntries(await Promise.all((Object.keys(coders) as Coder[]).map(async (c) => [c, await sortingsFor(c)])));
  const state = (c: Coder, q: string) => {
    const s = all[c][q];
    if (!s) return "Not started";
    const n = s.categories.length;
    return `${s.done ? "Finished" : "In progress"}, ${n} position${n === 1 ? "" : "s"}`;
  };

  return (
    <>
      {intro}
      <div className="mb-8 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[15px]">
        <span>Signed in as {coders[coder]}.</span>
        <form action={signOut}>
          <button className="text-ink-soft hover:text-ink">Sign out</button>
        </form>
      </div>
      <table className="w-full border-t border-rule text-left text-[15px]">
        <thead>
          <tr className="label border-b border-line">
            <th className="py-2 pr-4 font-normal">Question</th>
            <th className="py-2 pr-4 font-normal">Passages</th>
            {(Object.keys(coders) as Coder[]).map((c) => (
              <th key={c} className="py-2 pr-4 font-normal">{coders[c].split(" ")[0]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pools.map((p) => (
            <tr key={p.question} className="border-b border-line align-baseline">
              <td className="py-3 pr-4">
                <Link href={`/keys/${p.question.toLowerCase()}`} className="hover:underline">
                  <span className="num mr-2 font-mono text-[13px] text-ink-faint">{p.question}</span>
                  {p.text}
                </Link>
              </td>
              <td className="num py-3 pr-4 font-mono text-[13px]">{p.passages.length}</td>
              {(Object.keys(coders) as Coder[]).map((c) => (
                <td key={c} className="py-3 pr-4 text-[13.5px] text-ink-soft">{state(c, p.question)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!pools.length && <p className="mt-6 text-ink-soft">The passage pools are not built yet.</p>}
    </>
  );
}
