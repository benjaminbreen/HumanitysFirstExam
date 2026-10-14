import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { Chevron, summaryClass } from "@/components/Row";
import { coders, currentCoder, progress, sample, type Side } from "@/lib/coding";
import { getQuestion, getWork, quoteFor, stances } from "@/lib/data";

export const metadata: Metadata = { title: "Coding comparison", robots: { index: false } };

type Cat = Side;
const stanceById = new Map(stances.map((s) => [s.id, s]));
const claudeCat = (id: string): Cat => {
  const k = stanceById.get(id)?.side;
  return k === "yes" || k === "no" ? k : "other";
};

// Cohen's kappa on the items both raters placed (No position and Can't tell
// excluded).
const placed = (c: Cat) => c === "yes" || c === "no" || c === "other";
function agreement(a: Cat[], b: Cat[]) {
  const pairs = a.map((x, i) => [x, b[i]] as const).filter(([x, y]) => placed(x) && placed(y));
  const n = pairs.length;
  const agreed = pairs.filter(([x, y]) => x === y).length;
  const cats = ["yes", "no", "other"] as const;
  const pe = cats.reduce(
    (s, c) => s + (pairs.filter(([x]) => x === c).length / n) * (pairs.filter(([, y]) => y === c).length / n),
    0,
  );
  const kappa = n ? (agreed / n - pe) / (1 - pe) : NaN;
  return { n, agreed, kappa };
}

const labels: Record<Cat, string> = { yes: "Yes", no: "No", other: "Other", none: "No position", cannot: "Can’t tell" };
const label = (c: Cat) => labels[c];

export default async function ComparePage() {
  const coder = await currentCoder();
  if (!coder) redirect("/coding");
  const p = await progress();
  if (p.ben < p.total || p.nathan < p.total) {
    return (
      <PageTitle title="Comparison">
        <p>
          Opens when both coders have finished. {coders.ben}: {p.ben} of {p.total}. {coders.nathan}: {p.nathan} of{" "}
          {p.total}. <Link href="/coding" className="text-modern hover:underline">Back to coding</Link>
        </p>
      </PageTitle>
    );
  }

  const B = (i: (typeof sample.items)[number]) => p.entries.ben[i.item].side as Cat;
  const N = (i: (typeof sample.items)[number]) => p.entries.nathan[i.item].side as Cat;
  const C = (i: (typeof sample.items)[number]) => claudeCat(i.stance);
  const hasQuote = (i: (typeof sample.items)[number]) => Boolean(quoteFor(stanceById.get(i.stance)!));
  const table = (items: typeof sample.items) =>
    [
      ["Ben – Nathan", agreement(items.map(B), items.map(N))],
      ["Ben – Claude", agreement(items.map(B), items.map(C))],
      ["Nathan – Claude", agreement(items.map(N), items.map(C))],
    ] as const;
  const quoted = sample.items.filter(hasQuote);
  const unquoted = sample.items.filter((i) => !hasQuote(i));
  const noPosition = (f: typeof B) => quoted.filter((i) => f(i) === "none").length;
  const disagree = (i: (typeof sample.items)[number]) => new Set([B(i), N(i), C(i)]).size > 1;
  const order = [...sample.items].sort((a, b) => Number(disagree(b)) - Number(disagree(a)));

  return (
    <>
      <PageTitle title="Comparison">
        <p>
          Side agreement. Items either rater marked No position or Can’t tell are left out of that pair. “Other”
          answers agree only as a category; read the notes below. Ben marked No position on {noPosition(B)} of{" "}
          {quoted.length} quotations, Nathan on {noPosition(N)}.
        </p>
      </PageTitle>

      {(
        [
          [`${quoted.length} items with a quotation`, table(quoted)],
          [`${unquoted.length} items without a quotation`, table(unquoted)],
        ] as const
      ).map(([caption, rows]) => (
        <table key={caption} className="mb-10 w-full max-w-xl text-[15px]">
          <caption className="label mb-2 text-left">{caption}</caption>
          <thead>
            <tr className="border-b border-rule text-left">
              <th className="label pb-2 font-normal">Pair</th>
              <th className="label pb-2 text-right font-normal">Agreed</th>
              <th className="label pb-2 text-right font-normal">κ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, r]) => (
              <tr key={name} className="border-b border-line">
                <td className="py-2">{name}</td>
                <td className="num py-2 text-right font-mono">
                  {r.agreed} of {r.n}
                </td>
                <td className="num py-2 text-right font-mono">{r.n ? r.kappa.toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      <ol className="border-t border-rule">
        {order.map((i) => {
          const s = stanceById.get(i.stance);
          const w = getWork(i.work);
          const eb = p.entries.ben[i.item];
          const en = p.entries.nathan[i.item];
          return (
            <li key={i.item} className="border-b border-line">
              <details className="group">
                <summary className={`grid grid-cols-[2.5rem_1fr_1rem] items-baseline gap-x-4 lg:grid-cols-[2.5rem_1fr_8rem_8rem_8rem_1rem] ${summaryClass}`}>
                  <span className="num font-mono text-xs text-ink-faint">{i.item}</span>
                  <span className="text-[15px] leading-snug">
                    {getQuestion(i.question)?.question}
                    <span className="block text-[13.5px] text-ink-soft">
                      {w?.authorShort}, <span className="font-serif italic">{w?.title}</span>
                      {disagree(i) && <span className="ml-2 font-mono text-[11px] text-provisional">disagree</span>}
                    </span>
                  </span>
                  <span className="hidden text-[14px] lg:block">B: {label(B(i))}</span>
                  <span className="hidden text-[14px] lg:block">N: {label(N(i))}</span>
                  <span className="hidden text-[14px] lg:block">C: {label(C(i))}{C(i) === "other" && s ? `: ${s.sideLabel}` : ""}</span>
                  <Chevron />
                </summary>
                <div className="grid gap-6 pt-1 pb-6 text-[14.5px] leading-snug sm:ml-[calc(2.5rem+1rem)] md:grid-cols-3">
                  {(
                    [
                      ["Ben", label(B(i)), eb.note],
                      ["Nathan", label(N(i)), en.note],
                      ["Claude", `${s?.sideLabel ?? ""}${s?.sideGloss ? ` (${s.sideGloss})` : ""}`, s?.argument ?? ""],
                    ] as const
                  ).map(([who, side, note]) => (
                    <div key={who}>
                      <p className="label mb-1">{who}</p>
                      <p className="font-semibold">{side}</p>
                      {note && <p className="mt-1">{note}</p>}
                    </div>
                  ))}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </>
  );
}
