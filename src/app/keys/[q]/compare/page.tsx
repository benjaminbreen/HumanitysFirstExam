import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { currentCoder } from "@/lib/coding";
import { claudeKeys, getPool, pairRows, reconciliationFor, sortingFor, splitPassages, type Category, type PoolPassage } from "@/lib/keys";
import { Decide } from "./Decide";

export const metadata: Metadata = { title: "Compare positions", robots: { index: false } };

const letter = (i: number) => String.fromCharCode(65 + i);
const num = (id: string) => String(Number(id.replace(/\D/g, "")));

export default async function ComparePage({ params }: PageProps<"/keys/[q]/compare">) {
  const q = (await params).q.toUpperCase();
  const pool = getPool(q);
  if (!pool) notFound();
  const coder = await currentCoder();
  if (!coder) redirect(`/keys/${q.toLowerCase()}`);
  const mine = await sortingFor(coder, q);
  const back = <Link href={`/keys/${q.toLowerCase()}`} className="text-modern hover:underline">← Back to your positions</Link>;
  if (!mine.done) {
    return (
      <>
        <p className="mb-4 text-[14px]">{back}</p>
        <PageTitle title={`${q}: compare`}>
          <p>Mark the question finished on your positions page first. Claude’s positions stay hidden until then.</p>
        </PageTitle>
      </>
    );
  }
  const claude = claudeKeys[q] ?? { categories: [], off: [], unclear: [] };
  const rows = pairRows(mine.categories, claude.categories);
  const rec = await reconciliationFor(coder, q);
  const byId = new Map(pool.passages.map((p) => [p.id, p]));
  const myLetter = new Map(mine.categories.map((c, i) => [c.id, letter(i)]));
  const clNum = new Map(claude.categories.map((c, i) => [c.id, String(i + 1)]));
  const split = splitPassages(rows);
  const decided = rows.filter((r) => rec[r.id]?.decision).length;
  const where = (pid: string, cats: Category[], name: Map<string, string>, off: string[], unclear: string[]) =>
    [...cats.filter((c) => c.passages.includes(pid)).map((c) => name.get(c.id)!), ...(off.includes(pid) ? ["off"] : []), ...(unclear.includes(pid) ? ["unclear"] : [])].join(", ") || "not placed";

  return (
    <>
      <p className="mb-4 text-[14px]">{back}</p>
      <PageTitle title={`${q}: compare`}>
        <p className="text-ink">{pool.text}</p>
      </PageTitle>
      <div className="-mt-6 mb-8 max-w-3xl space-y-2 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Your positions have letters. Claude’s have numbers. Claude wrote its list from the same{" "}
          {pool.passages.length} passages without seeing yours. Two positions share a row when they cite some of the
          same passages. That is only a guess that they match. For each row, decide whether they are the same argument.
        </p>
        <p className="num font-mono text-[13px]">
          You: {mine.categories.length} positions. Claude: {claude.categories.length}. Decided: {decided} of {rows.length}.
        </p>
      </div>

      {!claude.categories.length && <p className="mb-8 text-period">Claude’s positions for this question are not written yet.</p>}

      <div className="border-t border-rule">
        <div className="label hidden grid-cols-[1fr_1fr_14rem] gap-6 border-b border-line py-2 md:grid">
          <span>Yours</span>
          <span>Claude’s</span>
          <span>Decision</span>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="grid gap-x-6 gap-y-3 border-b border-line py-5 md:grid-cols-[1fr_1fr_14rem]">
            <Position c={r.mine} tag={r.mine ? myLetter.get(r.mine.id)! : ""} byId={byId} shared={r.shared} who="You" />
            <Position c={r.claude} tag={r.claude ? clNum.get(r.claude.id)! : ""} byId={byId} shared={r.shared} who="Claude" />
            <Decide q={q} row={r.id} both={Boolean(r.mine && r.claude)} initial={rec[r.id]} />
          </div>
        ))}
      </div>

      {split.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="label mb-3 border-b border-rule pb-2">Same passage, different arguments</h2>
          <p className="mb-3 text-[14.5px] text-ink-soft">
            You and Claude both used these passages, but for positions that are not in the same row. Either one of you
            found a second argument in the passage, or two rows above are really the same position.
          </p>
          <ul className="space-y-1 text-[14.5px]">
            {split.map((pid) => (
              <li key={pid}>
                <a href={`/keys/${q.toLowerCase()}#${pid}`} className="hover:underline">
                  <span className="num font-mono text-[12px] text-ink-faint">{num(pid)}</span> {byId.get(pid)?.author}
                </a>
                : yours {where(pid, mine.categories, myLetter, mine.off, mine.unclear)}; Claude’s {where(pid, claude.categories, clNum, claude.off, claude.unclear)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 max-w-3xl">
        <h2 className="label mb-3 border-b border-rule pb-2">Set aside</h2>
        <dl className="grid grid-cols-[9rem_1fr] gap-y-1 text-[14.5px]">
          <dt className="text-ink-soft">Off the question</dt>
          <dd>You: {list(mine.off)}. Claude: {list(claude.off)}.</dd>
          <dt className="text-ink-soft">Unclear</dt>
          <dd>You: {list(mine.unclear)}. Claude: {list(claude.unclear)}.</dd>
        </dl>
      </section>
    </>
  );
}

const list = (xs: string[]) => (xs.length ? xs.map(num).join(", ") : "none");

function Position({ c, tag, byId, shared, who }: { c: Category | null; tag: string; byId: Map<string, PoolPassage>; shared: string[]; who: string }) {
  if (!c) return <p className="text-[14px] text-ink-faint md:pt-1">{who}: no matching position.</p>;
  return (
    <div>
      <p className="text-[15px] leading-snug">
        <span className="mr-2 font-mono text-[13px] font-semibold">{tag}</span>
        {c.claim || <span className="text-ink-faint">(no claim)</span>}
      </p>
      {c.reason && <p className="mt-1 text-[14px] leading-snug text-ink-soft">{c.reason}</p>}
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
        {c.passages.map((pid) => (
          <span key={pid} className={shared.includes(pid) ? "text-ink" : "text-ink-faint"} title={shared.includes(pid) ? "Both used this passage here" : undefined}>
            <span className="num font-mono text-[11px]">{num(pid)}</span> {byId.get(pid)?.author.split(/[ ,]+/).pop()}
            {shared.includes(pid) && " ●"}
          </span>
        ))}
      </p>
    </div>
  );
}
