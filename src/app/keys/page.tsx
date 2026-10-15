import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { coders, currentCoder, storage, type Coder } from "@/lib/coding";
import { pools, sortingsFor } from "@/lib/keys";
import { signOut } from "./auth";
import { SignIn } from "./SignIn";

export const metadata: Metadata = { title: "Position keys", robots: { index: false } };

export default async function KeysPage({ searchParams }: PageProps<"/keys">) {
  const coder = await currentCoder();
  const error = Boolean((await searchParams).error);
  const intro = (
    <>
      <PageTitle title="Position keys">
        <p>
          A position key is the list of different answers that writers between 1600 and 1950 gave to one of our
          questions. Later, each model answer is matched against this list. These pages build the lists for the six
          pilot questions. This is a prototype.
        </p>
      </PageTitle>
      <ol className="mb-10 max-w-3xl list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
        <li>
          <span className="text-ink">Find passages.</span> We search the full texts of the 204 works on our source
          list for passages about the question. Claude reads the 45 closest matches, plus the quotations it had
          already found for the question, and keeps the 15 to 21 that discuss it, whatever answer they give, with no more than two from any one work. Every passage is checked
          word for word against the source text.
        </li>
        <li>
          <span className="text-ink">Read and list the answers.</span> A historian reads the passages and works out
          what each implies about our question. Each distinct line becomes a
          position: the implied answer, the argument the text gives for it, and the passages that support it. Claude does
          the same, separately. Neither sees the other’s list.
        </li>
        <li>
          <span className="text-ink">Compare.</span> When the historian is finished, the two lists appear side by
          side. For each pair of positions, the historian decides whether they are the same argument, and which
          positions go into the key.
        </li>
        <li>
          <span className="text-ink">Fix the key.</span> The key is fixed before anyone reads the models’ answers.
          Claude then matches every model answer against the key, and the historians check a sample of Claude’s
          matches without seeing them first.
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
