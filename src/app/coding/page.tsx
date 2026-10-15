import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { Quote } from "@/components/Quote";
import { coders, currentCoder, needsPasscode, progress, sample, storage, type Coder, type Entry, type SampleItem, type Side } from "@/lib/coding";
import { formatYear, getQuestion, getWork, quoteFor, stances } from "@/lib/data";
import { mark, saveNote, signIn, signOut } from "./actions";

export const metadata: Metadata = { title: "Passage check", robots: { index: false } };

const OPEN = new Set(["Q19"]); // questions not answerable yes/no
const stanceById = new Map(stances.map((s) => [s.id, s]));
const labels: Record<Side, string> = { yes: "Yes", no: "No", other: "Other", none: "No position", cannot: "Can’t tell" };

export default async function CodingPage({ searchParams }: PageProps<"/coding">) {
  return (
    <>
      <p className="mb-8 max-w-3xl border-l-2 border-rule pl-3 text-[15px]">
        This yes/no check is no longer in use. The current task is the{" "}
        <Link href="/keys" className="text-modern hover:underline">position keys</Link>.
      </p>
      <OldCheck searchParams={searchParams} />
    </>
  );
}

async function OldCheck({ searchParams }: { searchParams: PageProps<"/coding">["searchParams"] }) {
  const coder = await currentCoder();
  const error = (await searchParams).error;

  if (storage === "none") {
    return (
      <PageTitle title="Coding">
        <p>Coding is not available on this site yet.</p>
      </PageTitle>
    );
  }

  if (!coder) {
    return (
      <>
        <PageTitle title="Coding">
          <p>
            A blind check of {sample.items.length} quotations chosen by Claude, for comparison with Claude’s
            coding. Sign in to continue.
          </p>
        </PageTitle>
        <form action={signIn} className="max-w-sm space-y-4">
          <fieldset className="flex gap-6 text-[15px]">
            <legend className="label mb-2">Coder</legend>
            {(Object.keys(coders) as Coder[]).map((c) => (
              <label key={c} className="inline-flex items-center gap-2">
                <input type="radio" name="coder" value={c} required /> {coders[c]}
              </label>
            ))}
          </fieldset>
          {needsPasscode && (
            <input
              name="passcode"
              type="password"
              placeholder="Passcode"
              className="w-full border border-line bg-bg px-3 py-2 font-mono text-[14px] outline-none focus:border-ink"
            />
          )}
          {error && <p className="font-mono text-[12px] text-period">Wrong coder or passcode.</p>}
          <button className="border border-rule px-4 py-2 font-mono text-[13px] hover:bg-surface">Sign in</button>
        </form>
      </>
    );
  }

  const p = await progress();
  const mine = p.entries[coder];
  const other: Coder = coder === "ben" ? "nathan" : "ben";
  const finished = p.ben === p.total && p.nathan === p.total;

  return (
    <>
      <PageTitle title="Passage check">
        <p>
          For each item, does the quotation answer the question, and which way? Use Other for an answer that is
          neither yes nor no, and say what it is in a note. One click saves. You can change an answer until the
          comparison opens; earlier answers are kept.
        </p>
      </PageTitle>

      <div className="mb-8 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[15px]">
        <span>
          {coders[coder]}: <span className="num font-mono">{p[coder]}</span> of {p.total} coded.{" "}
          {coders[other].split(" ")[0]}: <span className="num font-mono">{p[other]}</span>.
        </span>
        {finished ? (
          <Link href="/coding/compare" className="text-modern hover:underline">Comparison →</Link>
        ) : (
          <span className="text-ink-soft">The comparison opens when both have finished.</span>
        )}
        <Link href="/coding/protocol" className="text-modern hover:underline">Protocol</Link>
        <form action={signOut}>
          <button className="text-ink-soft hover:text-ink">Sign out</button>
        </form>
      </div>

      <ol className="border-t border-rule">
        {sample.items.map((i) => (
          <Item key={i.item} i={i} e={mine[i.item]} />
        ))}
      </ol>
    </>
  );
}

function Item({ i, e }: { i: SampleItem; e?: Entry }) {
  const q = getQuestion(i.question);
  const w = getWork(i.work);
  const stance = stanceById.get(i.stance);
  const quote = stance && quoteFor(stance);
  const sides: Side[] = [...(OPEN.has(i.question) ? [] : (["yes", "no"] as const)), "other", quote ? "none" : "cannot"];
  return (
    <li id={i.item} className="grid scroll-mt-6 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-line py-7">
      <span className="num pt-1 font-mono text-xs text-ink-faint">{i.item}</span>
      <div className="max-w-3xl">
        <p className="text-[1.1rem] leading-snug font-semibold">{q?.question}</p>
        <p className="mt-1 text-[14.5px] text-ink-soft">
          <span className="num mr-2 font-mono text-[12px] text-ink-faint">{w && formatYear(w.year)}</span>
          {w?.author}, <span className="font-serif italic">{w?.title}</span>
          {w?.textUrl && (
            <a href={w.textUrl} target="_blank" rel="noreferrer" className="ml-3 text-modern hover:underline">
              Full text ↗
            </a>
          )}
        </p>
        {quote ? (
          <div className="mt-3">
            <Quote p={quote} />
          </div>
        ) : (
          <p className="mt-3 text-[14.5px] text-ink-soft">
            Claude found no quotation for this work. Answer from your knowledge of the work, or mark Can’t tell.
          </p>
        )}
        <form action={mark} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="item" value={i.item} />
          {sides.map((s) => (
            <button
              key={s}
              name="side"
              value={s}
              aria-pressed={e?.side === s}
              className={`border px-3 py-1.5 font-mono text-[13px] ${
                e?.side === s ? "border-ink bg-ink text-bg" : "border-rule hover:bg-surface"
              }`}
            >
              {labels[s]}
            </button>
          ))}
        </form>
        <details className="mt-3" open={Boolean(e?.note)}>
          <summary className="cursor-pointer text-[13px] text-ink-soft hover:text-ink">Note</summary>
          <form action={saveNote} className="mt-2 flex items-start gap-2">
            <input type="hidden" name="item" value={i.item} />
            <textarea
              name="note"
              defaultValue={e?.note}
              rows={2}
              className="w-full max-w-xl border border-line bg-bg px-2 py-1.5 text-[14px] leading-snug outline-none focus:border-ink"
            />
            <button className="border border-rule px-3 py-1.5 font-mono text-[12px] hover:bg-surface">Save</button>
          </form>
        </details>
      </div>
    </li>
  );
}
