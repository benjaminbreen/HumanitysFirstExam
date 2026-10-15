"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Category, PoolPassage, Sorting } from "@/lib/keys";
import { saveSortingAction } from "../actions";

// The reader's working surface: passages on the left, the positions they
// write on the right. A passage joins a position by drag or by its menu.

type Box = string; // a category id, "off" or "unclear"
const letter = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
const num = (id: string) => String(Number(id.replace(/\D/g, "")));
const newId = () => "c" + Math.random().toString(36).slice(2, 8);

export function Board({ q, passages, initial }: { q: string; passages: PoolPassage[]; initial: Sorting }) {
  const [s, setS] = useState<Sorting>(initial);
  const [status, setStatus] = useState<"saved" | "saving" | "error" | "idle">(initial.savedAt ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState(initial.savedAt);
  const [onlyUnplaced, setOnlyUnplaced] = useState(false);
  const [over, setOver] = useState<Box | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const first = useRef(true);
  const byId = new Map(passages.map((p) => [p.id, p]));

  // Save shortly after each change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    const t = setTimeout(async () => {
      try {
        const saved = await saveSortingAction(q, s);
        setSavedAt(saved.savedAt);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [s, q]);

  const boxesOf = (pid: string): Box[] => [
    ...s.categories.filter((c) => c.passages.includes(pid)).map((c) => c.id),
    ...(s.off.includes(pid) ? ["off"] : []),
    ...(s.unclear.includes(pid) ? ["unclear"] : []),
  ];
  const placed = passages.filter((p) => boxesOf(p.id).length).length;

  const update = (f: (x: Sorting) => Sorting) => setS((x) => f(structuredClone(x)));
  const add = (pid: string, box: Box, from?: Box) =>
    update((x) => {
      if (from && from !== box) remove_(x, pid, from);
      if (box === "off" || box === "unclear") {
        if (!x[box].includes(pid)) x[box].push(pid);
      } else {
        const c = x.categories.find((c) => c.id === box);
        if (c && !c.passages.includes(pid)) c.passages.push(pid);
      }
      return x;
    });
  const remove = (pid: string, box: Box) => update((x) => (remove_(x, pid, box), x));
  const newCategory = (pid?: string) => {
    const id = newId();
    update((x) => {
      x.categories.push({ id, claim: "", reason: "", passages: pid ? [pid] : [] });
      return x;
    });
    setFocus(id);
  };
  const edit = (id: string, field: "claim" | "reason", v: string) =>
    update((x) => {
      const c = x.categories.find((c) => c.id === id);
      if (c) c[field] = v;
      return x;
    });
  const del = (c: Category) => {
    if ((c.claim || c.reason || c.passages.length) && !confirm("Delete this position? Its passages become unplaced.")) return;
    update((x) => ({ ...x, categories: x.categories.filter((y) => y.id !== c.id) }));
  };
  const move = (id: string, d: -1 | 1) =>
    update((x) => {
      const i = x.categories.findIndex((c) => c.id === id);
      const j = i + d;
      if (i < 0 || j < 0 || j >= x.categories.length) return x;
      [x.categories[i], x.categories[j]] = [x.categories[j], x.categories[i]];
      return x;
    });

  const label = (b: Box) => {
    if (b === "off") return "Off the question";
    if (b === "unclear") return "Unclear";
    const i = s.categories.findIndex((c) => c.id === b);
    return letter(i);
  };

  const dropProps = (box: Box) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(box);
    },
    onDragLeave: () => setOver((o) => (o === box ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(null);
      const [pid, from] = e.dataTransfer.getData("text/plain").split("|");
      if (byId.has(pid)) add(pid, box, from || undefined);
    },
  });
  const dragFrom = (pid: string, from?: Box) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", `${pid}|${from ?? ""}`);
      e.dataTransfer.effectAllowed = from ? "move" : "copy";
    },
  });

  const chip = (pid: string, box: Box) => {
    const p = byId.get(pid);
    if (!p) return null;
    return (
      <li
        key={pid}
        {...dragFrom(pid, box)}
        className="inline-flex cursor-grab items-center gap-1.5 border border-line bg-bg py-0.5 pr-1 pl-2 text-[13px] active:cursor-grabbing"
      >
        <a href={`#${pid}`} className="hover:underline" title={`${p.author}, ${p.title}`}>
          <span className="num font-mono text-[11px] text-ink-faint">{num(pid)}</span> {short(p.author)}
          <span className="num ml-1 font-mono text-[11px] text-ink-faint">{yr(p.year)}</span>
        </a>
        <button onClick={() => remove(pid, box)} aria-label={`Remove passage ${num(pid)}`} className="px-1 text-ink-faint hover:text-ink">
          ×
        </button>
      </li>
    );
  };

  const shown = onlyUnplaced ? passages.filter((p) => !boxesOf(p.id).length) : passages;

  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      {/* Passages */}
      <section aria-label="Passages">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
          <h2 className="label">Passages</h2>
          <div className="flex items-baseline gap-4 text-[13px]">
            <span className="num font-mono text-ink-soft">
              {placed} of {passages.length} placed
            </span>
            <label className="inline-flex items-center gap-1.5 text-ink-soft">
              <input type="checkbox" checked={onlyUnplaced} onChange={(e) => setOnlyUnplaced(e.target.checked)} /> Unplaced only
            </label>
          </div>
        </div>
        <ol>
          {shown.map((p) => {
            const at = boxesOf(p.id);
            return (
              <li key={p.id} id={p.id} {...dragFrom(p.id)} className="group scroll-mt-6 border-b border-line py-5">
                <div className="flex items-start gap-3">
                  <span className="num w-6 shrink-0 pt-0.5 text-right font-mono text-[13px] text-ink-faint" aria-hidden>
                    {num(p.id)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] text-ink-soft">
                      <span className="text-ink">{p.author}</span>, <span className="font-serif italic">{p.title}</span>
                      <span className="num ml-2 font-mono text-[12px] text-ink-faint">{yr(p.year)}</span>
                      {p.language !== "English" && <span className="ml-2 font-mono text-[12px] text-ink-faint">{p.language}</span>}
                    </p>
                    {p.translation ? (
                      <>
                        <p className="mt-2 font-serif text-[1.02rem] leading-relaxed">{p.translation}</p>
                        <details className="mt-1">
                          <summary className="cursor-pointer text-[12.5px] text-ink-faint hover:text-ink">
                            Original ({p.language}); translation by Claude
                          </summary>
                          <p className="mt-1 font-serif text-[0.97rem] leading-relaxed text-ink-soft">{p.display}</p>
                        </details>
                      </>
                    ) : (
                      <p className="mt-2 font-serif text-[1.02rem] leading-relaxed">{p.display}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {at.map((b) => (
                        <span key={b} className="inline-flex items-center gap-1 border border-rule px-1.5 py-0.5 font-mono text-[12px]">
                          {label(b)}
                          <button onClick={() => remove(p.id, b)} aria-label={`Remove from ${label(b)}`} className="text-ink-faint hover:text-ink">
                            ×
                          </button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "new") newCategory(p.id);
                          else if (v) add(p.id, v);
                        }}
                        className="border border-line bg-bg px-1.5 py-0.5 text-[13px] text-ink-soft hover:border-ink"
                        aria-label={`Add passage ${num(p.id)} to a position`}
                      >
                        <option value="">Add to…</option>
                        {s.categories.map((c, i) => (
                          <option key={c.id} value={c.id} disabled={c.passages.includes(p.id)}>
                            {letter(i)}. {c.claim ? trim(c.claim, 48) : "(no claim yet)"}
                          </option>
                        ))}
                        <option value="new">New position…</option>
                        <option value="off" disabled={s.off.includes(p.id)}>Off the question</option>
                        <option value="unclear" disabled={s.unclear.includes(p.id)}>Unclear</option>
                      </select>
                      <span className="hidden text-[12px] text-ink-faint lg:group-hover:inline">or drag to a position</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="py-6 text-[14.5px] text-ink-soft">Every passage is placed.</li>}
        </ol>
      </section>

      {/* Positions */}
      <section aria-label="Positions" className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        <div className="mb-3 flex items-baseline justify-between border-b border-rule pb-2">
          <h2 className="label">Positions</h2>
          <span className="font-mono text-[12px] text-ink-faint" aria-live="polite">
            {status === "saving" ? "Saving…" : status === "error" ? "Not saved. Check your connection." : savedAt ? `Saved ${time(savedAt)}` : ""}
          </span>
        </div>

        <ol className="space-y-4">
          {s.categories.map((c, i) => (
            <li key={c.id} {...dropProps(c.id)} className={`border p-3 ${over === c.id ? "border-ink bg-surface" : "border-line"}`}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[13px] font-semibold">{letter(i)}</span>
                <span className="flex gap-2 text-[12px] text-ink-faint">
                  <button onClick={() => move(c.id, -1)} disabled={i === 0} className="hover:text-ink disabled:opacity-30" aria-label="Move up">↑</button>
                  <button onClick={() => move(c.id, 1)} disabled={i === s.categories.length - 1} className="hover:text-ink disabled:opacity-30" aria-label="Move down">↓</button>
                  <button onClick={() => del(c)} className="hover:text-period">Delete</button>
                </span>
              </div>
              <Field label="Claim" value={c.claim} autoFocus={focus === c.id} placeholder="What the writer holds about the question" onChange={(v) => edit(c.id, "claim", v)} />
              <Field label="Reason" value={c.reason} placeholder="Why: the reasoning that sets this position apart" onChange={(v) => edit(c.id, "reason", v)} />
              <ul className="mt-2 flex min-h-9 flex-wrap gap-1.5 border border-dashed border-line p-1.5">
                {c.passages.map((pid) => chip(pid, c.id))}
                {!c.passages.length && <li className="self-center px-1 text-[12.5px] text-ink-faint">Drop passages here</li>}
              </ul>
            </li>
          ))}
        </ol>
        <button onClick={() => newCategory()} className="mt-4 w-full border border-rule py-2 font-mono text-[13px] hover:bg-surface">
          + New position
        </button>

        {(["off", "unclear"] as const).map((b) => (
          <div key={b} {...dropProps(b)} className={`mt-4 border p-3 ${over === b ? "border-ink bg-surface" : "border-line"}`}>
            <p className="text-[13.5px] font-medium">{label(b)}</p>
            <p className="text-[12.5px] text-ink-faint">
              {b === "off" ? "Does not address this question, or answers a neighbouring one. Say which in a position, or leave it here." : "Can't tell what it holds."}
            </p>
            <ul className="mt-2 flex min-h-9 flex-wrap gap-1.5 border border-dashed border-line p-1.5">
              {s[b].map((pid) => chip(pid, b))}
            </ul>
          </div>
        ))}

        <div className="mt-6 border-t border-rule pt-4">
          <label className="flex items-start gap-2 text-[14.5px]">
            <input
              type="checkbox"
              className="mt-1"
              checked={s.done}
              onChange={(e) => update((x) => ({ ...x, done: e.target.checked }))}
            />
            <span>
              I have finished this question.
              <span className="block text-[13px] text-ink-faint">Opens the comparison with Claude’s positions. You can keep editing.</span>
            </span>
          </label>
          {s.done && status !== "saving" && (
            <Link href={`/keys/${q.toLowerCase()}/compare`} className="mt-3 inline-block text-modern hover:underline">
              Compare with Claude →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <label className="mt-2 block">
      <span className="font-mono text-[11px] tracking-wider text-ink-faint uppercase">{label}</span>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full resize-none border-b border-line bg-transparent py-1 text-[14.5px] leading-snug outline-none placeholder:text-ink-faint focus:border-ink"
      />
    </label>
  );
}

function remove_(x: Sorting, pid: string, box: Box) {
  if (box === "off" || box === "unclear") x[box] = x[box].filter((p) => p !== pid);
  else {
    const c = x.categories.find((c) => c.id === box);
    if (c) c.passages = c.passages.filter((p) => p !== pid);
  }
}
const short = (author: string) => author.replace(/\s*\(.*?\)/g, "").split(/[ ,]+/).filter(Boolean).pop() ?? author;
const yr = (y: number | null) => (y == null ? "" : y < 0 ? `${-y} BC` : String(y));
const trim = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
