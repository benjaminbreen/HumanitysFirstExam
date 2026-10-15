import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { corpora, entityQuery, search, searchAvailable, type Hit } from "@/lib/search";

export const metadata: Metadata = { title: "Search" };

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const p = await searchParams;
  const available = searchAvailable();
  const all = corpora();
  const q = str(p.q).trim().slice(0, 300);
  const entity = entityQuery(q);
  const chosen = p.c ? (Array.isArray(p.c) ? p.c : [p.c]) : all.filter((c) => c.default !== false).map((c) => c.id);
  const from = Number(str(p.from)) || undefined;
  const to = Number(str(p.to)) || undefined;

  let result: { hits: Hit[]; scanned: number; ms: number } | null = null;
  let error = "";
  if (available && q) {
    try {
      result = await search({ q, corpora: chosen, from, to });
    } catch (e) {
      error = e instanceof Error ? e.message : "Search failed.";
    }
  }
  const label = Object.fromEntries(all.map((c) => [c.id, c.label]));

  return (
    <>
      <PageTitle title="Search">
        <p>
          Search the collections of period texts assembled for the pilots. A quoted name, or a known author’s full
          name, must match a passage or its author. The remaining words rank those matches by meaning.
        </p>
      </PageTitle>

      {!available ? (
        <p className="text-ink-soft">
          Search is not available yet.
        </p>
      ) : (
        <>
          <form method="get" className="border-y border-line py-5">
            <input
              name="q"
              defaultValue={q}
              placeholder="e.g. machines are God’s gift and man must stay their master"
              className="w-full rounded-md border border-line bg-bg px-4 py-3 text-[1.1rem] outline-none focus:border-ink"
            />
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <fieldset className="flex flex-wrap gap-x-5 gap-y-1">
                <legend className="sr-only">Corpora</legend>
                {all.map((c) => (
                  <label key={c.id} className="inline-flex items-center gap-2">
                    <input type="checkbox" name="c" value={c.id} defaultChecked={chosen.includes(c.id)} />
                    {c.label}
                    <span className="num font-mono text-xs text-ink-faint">{c.count.toLocaleString()}</span>
                  </label>
                ))}
              </fieldset>
              <label className="inline-flex items-center gap-2">
                <span className="label">Years</span>
                <input name="from" defaultValue={from ?? ""} placeholder="1600" inputMode="numeric" className="num w-20 rounded border border-line bg-bg px-2 py-1 font-mono text-[13px]" />
                –
                <input name="to" defaultValue={to ?? ""} placeholder="1950" inputMode="numeric" className="num w-20 rounded border border-line bg-bg px-2 py-1 font-mono text-[13px]" />
              </label>
              <button type="submit" className="rounded-md bg-ink px-4 py-1.5 text-bg">Search</button>
            </div>
          </form>

          {error && <p className="mt-6 text-period">{error}</p>}

          {result && (
            <section className="mt-6">
              <p className="num font-mono text-[12.5px] text-ink-soft">
                {result.hits.length} closest of {result.scanned.toLocaleString()} {entity ? "entity matches" : "passages"} · {result.ms} ms ·
                {entity || q.split(/\s+and\s+/i).length === 2 ? "combined relevance score" : "similarity is cosine, 0–1"} · bold
                marks the two or three sentences closest in meaning
              </p>
              {entity && result.hits.length === 0 && <p className="mt-4 text-ink-soft">No passages in the selected corpora match {entity.entity}.</p>}
              <ol className="mt-4">
                {result.hits.map((h, i) => (
                  <li key={i} className="grid gap-x-8 gap-y-2 border-b border-line py-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <div className="text-sm">
                      <p className="font-medium leading-snug">
                        {h.work ? (
                          <Link href={`/sources/${h.work}`} className="hover:underline hover:underline-offset-4">
                            {h.source}
                          </Link>
                        ) : (
                          h.source
                        )}
                      </p>
                      <p className="num mt-1 font-mono text-xs text-ink-soft">
                        {h.year ?? "—"}
                        {h.state ? ` · ${h.state}` : ""} · {h.score.toFixed(3)}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">{label[h.corpus]}</p>
                      {h.match && <p className="mt-1 text-xs text-ink-faint">{h.match}</p>}
                    </div>
                    <p className="font-serif text-[1.02rem] leading-relaxed">
                      {h.closest ? (
                        <>
                          {h.text.slice(0, h.closest[0])}
                          <strong className="font-semibold">{h.text.slice(...h.closest)}</strong>
                          {h.text.slice(h.closest[1])}
                        </>
                      ) : (
                        h.text
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </>
  );
}
