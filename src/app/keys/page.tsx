import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { coders, currentCoder, storage, type Coder } from "@/lib/coding";
import { AgreementKey, AgreementTable } from "@/components/Agreement";
import { addTallies, claudeSorting, finalFor, MAX_POSITIONS, pools, sortingsFor, tally } from "@/lib/keys";
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
          already found for the question, and keeps the 15 to 21 that discuss it, whatever answer they give, with no
          more than two from any one work. Every passage is checked word for word against the source text.
        </li>
        <li>
          <span className="text-ink">Sort them, separately.</span> Ben, Nathan and Claude each sort the passages into
          positions, up to {MAX_POSITIONS}. A position is an implied answer, the argument the text gives for it, and a
          direction (Yes, No or Other). Each passage goes in one position, or off the question, or unclear. Nobody
          sees another list until Ben and Nathan have both finished.
        </li>
        <li>
          <span className="text-ink">Measure agreement.</span> When both have finished, the lists lock and the
          agreement figures open: for each pair of sorters, how often they grouped passages together and gave them
          the same direction. Claude passes if it agrees with each historian about as often as they agree with each
          other, across the six questions.
        </li>
        <li>
          <span className="text-ink">Make the final list.</span> Ben and Nathan merge their two lists into one, without
          Claude’s, then add any position from Claude’s list that both agree a passage states. The list freezes when
          both agree to it, before anyone reads the models’ answers. This is the list the site shows.
        </li>
        <li>
          <span className="text-ink">Then.</span> If Claude passed, it sorts the other 34 questions the same way and Ben
          and Nathan check one or two of them by the same procedure. If not, Claude’s instructions are revised and
          tested on a question it has not seen.
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
  const open = pools.filter((p) => all.ben[p.question]?.done && all.nathan[p.question]?.done).map((p) => p.question);
  const finals = Object.fromEntries(await Promise.all(open.map(async (q) => [q, await finalFor(q)])));
  const pooled = (a: (q: string) => Parameters<typeof tally>[1], b: (q: string) => Parameters<typeof tally>[1]) => addTallies(open.map((q) => tally(q, a(q), b(q))));
  const ben = (q: string) => all.ben[q];
  const nathan = (q: string) => all.nathan[q];

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
            <th className="py-2 pr-4 font-normal">Agreement</th>
            <th className="py-2 pr-4 font-normal">Final list</th>
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
              <td className="py-3 pr-4 text-[13.5px] text-ink-soft">
                {open.includes(p.question) ? <Link href={`/keys/${p.question.toLowerCase()}/agreement`} className="text-modern hover:underline">Open</Link> : "After both finish"}
              </td>
              <td className="py-3 pr-4 text-[13.5px] text-ink-soft">
                {!open.includes(p.question) ? "–" : (
                  <Link href={`/keys/${p.question.toLowerCase()}/final`} className="text-modern hover:underline">
                    {finals[p.question].frozenAt ? "Frozen" : finals[p.question].categories.length ? "In progress" : "Not started"}
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!pools.length && <p className="mt-6 text-ink-soft">The passage pools are not built yet.</p>}
      {open.length > 0 && (
        <section className="mt-12">
          <h2 className="label mb-3">Agreement across {open.length} of {pools.length} questions ({open.join(", ")})</h2>
          <AgreementTable
            rows={[
              { pair: "Ben and Nathan", t: pooled(ben, nathan) },
              { pair: "Ben and Claude", t: pooled(ben, claudeSorting) },
              { pair: "Nathan and Claude", t: pooled(nathan, claudeSorting) },
            ]}
          />
          <AgreementKey />
        </section>
      )}
    </>
  );
}
