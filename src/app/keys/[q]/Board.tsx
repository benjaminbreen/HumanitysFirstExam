"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Category, Direction, PoolPassage, Sorting } from "@/lib/keys";
import { saveJointAction, saveSortingAction } from "../actions";

// The sorter's working surface: passages on the left, the positions they
// write on the right. A passage goes in one position (or off the question,
// or unclear), by drag or by its menu. The same board edits the final list.

type Box = string; // a category id, "off" or "unclear"
const letter = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
const num = (id: string) => String(Number(id.replace(/\D/g, "")));
const newId = () => "c" + Math.random().toString(36).slice(2, 8);

export function Board({ q, passages, initial, labels, max, mode = "sort", locked = false, footer, onSaved, onSavingChange }: {
  q: string; max: number; passages: PoolPassage[]; initial: Sorting; labels: Record<Direction, string>;
  mode?: "sort" | "reference" | "final"; locked?: boolean; footer?: React.ReactNode; onSaved?: (s: Sorting) => void; onSavingChange?: (saving: boolean) => void;
}) {
  const [s, setS] = useState<Sorting>(initial);
  const [status, setStatus] = useState<"saved" | "saving" | "error" | "idle">(initial.savedAt ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState(initial.savedAt);
  const [onlyUnplaced, setOnlyUnplaced] = useState(false);
  const [over, setOver] = useState<Box | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const first = useRef(true);
  const callbacks = useRef({ onSaved, onSavingChange });
  const latest = useRef(initial), sequence = useRef(0), persisted = useRef(0), version = useRef(initial.version), running = useRef(false);
  const flush = useRef<() => Promise<void>>(async () => {});
  const [saveError, setSaveError] = useState("");
  useEffect(() => { callbacks.current = { onSaved, onSavingChange }; });
  const byId = new Map(passages.map((p) => [p.id, p]));

  // Serialize saves so an older response cannot overwrite newer local edits.
  // The server also checks the version against other tabs and the other historian.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    latest.current = s;
    sequence.current++;
    callbacks.current.onSavingChange?.(true);
    setStatus("saving");
    const save = async () => {
      if (running.current) return;
      running.current = true;
      try {
        while (persisted.current < sequence.current) {
          const seq = sequence.current, snapshot = latest.current;
          const saved = mode === "sort"
            ? await saveSortingAction(q, snapshot, version.current)
            : await saveJointAction(q, mode, snapshot, version.current);
          version.current = saved.version;
          persisted.current = seq;
          setSavedAt(saved.savedAt);
          callbacks.current.onSaved?.(saved);
        }
        setSaveError("");
        setStatus("saved");
        callbacks.current.onSavingChange?.(false);
      } catch (e) {
        setStatus("error");
        setSaveError(e instanceof Error ? e.message : "Could not save. Reload and try again.");
      } finally { running.current = false; }
    };
    flush.current = save;
    const timer = setTimeout(save, 600);
    return () => clearTimeout(timer);
  }, [s, q, mode]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (persisted.current < sequence.current) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      // A client-side navigation must not discard a pending debounce.
      void flush.current();
    };
  }, []);

  const boxesOf = (pid: string): Box[] => [
    ...s.categories.filter((c) => c.passages.includes(pid)).map((c) => c.id),
    ...(s.off.includes(pid) ? ["off"] : []),
    ...(s.unclear.includes(pid) ? ["unclear"] : []),
  ];
  const placed = passages.filter((p) => boxesOf(p.id).length).length;

  const update = (f: (x: Sorting) => Sorting) => {
    callbacks.current.onSavingChange?.(true);
    setS((x) => f(structuredClone(x)));
  };
  const add = (pid: string, box: Box) =>
    update((x) => {
      for (const b of boxesIn(x, pid)) remove_(x, pid, b); // one place per passage
      if (box === "off" || box === "unclear") {
        if (!x[box].includes(pid)) x[box].push(pid);
      } else {
        const c = x.categories.find((c) => c.id === box);
        if (c && !c.passages.includes(pid)) c.passages.push(pid);
      }
      return x;
    });
  const remove = (pid: string, box: Box) => update((x) => (remove_(x, pid, box), x));
  const full = s.categories.length >= max;
  const newCategory = (pid?: string) => {
    if (full) return;
    const id = newId();
    update((x) => {
      if (pid) for (const b of boxesIn(x, pid)) remove_(x, pid, b);
      x.categories.push({ id, claim: "", reason: "", passages: pid ? [pid] : [] });
      return x;
    });
    setFocus(id);
  };
  const edit = (id: string, field: "claim" | "reason" | "note", v: string) =>
    update((x) => {
      const c = x.categories.find((c) => c.id === id);
      if (c) c[field] = v;
      return x;
    });
  const setDirection = (id: string, d: Direction) =>
    update((x) => {
      const c = x.categories.find((c) => c.id === id);
      if (c) c.direction = c.direction === d ? null : d;
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
      const [pid] = e.dataTransfer.getData("text/plain").split("|");
      if (byId.has(pid)) add(pid, box);
    },
  });
  const dragFrom = (pid: string, from?: Box) => locked ? {} : ({
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
        {!locked && (
          <button onClick={() => remove(pid, box)} aria-label={`Remove passage ${num(pid)}`} className="px-1 text-ink-faint hover:text-ink">
            ×
          </button>
        )}
      </li>
    );
  };

  const unplaced = passages.length - placed;
  const missing = [
    ...(unplaced ? [`${unplaced} passage${unplaced === 1 ? "" : "s"} not placed`] : []),
    ...s.categories.filter((c) => !c.claim.trim()).map((c) => `answer for ${label(c.id)}`),
    ...s.categories.filter((c) => !c.reason.trim()).map((c) => `argument for ${label(c.id)}`),
    ...s.categories.filter((c) => !c.direction).map((c) => `direction for ${label(c.id)}`),
    ...s.categories.filter((c) => !c.passages.length).map((c) => `no passages in ${label(c.id)}`),
  ];
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
                          {!locked && (
                            <button onClick={() => remove(p.id, b)} aria-label={`Remove from ${label(b)}`} className="text-ink-faint hover:text-ink">
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {!locked && <select
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "new") newCategory(p.id);
                          else if (v) add(p.id, v);
                        }}
                        className="border border-line bg-bg px-1.5 py-0.5 text-[13px] text-ink-soft hover:border-ink"
                        aria-label={`Add passage ${num(p.id)} to a position`}
                      >
                        <option value="">{at.length ? "Move to…" : "Put in…"}</option>
                        {s.categories.map((c, i) => (
                          <option key={c.id} value={c.id} disabled={c.passages.includes(p.id)}>
                            {letter(i)}. {c.claim ? trim(c.claim, 48) : "(no answer written yet)"}
                          </option>
                        ))}
                        {!full && <option value="new">New position…</option>}
                        <option value="off" disabled={s.off.includes(p.id)}>Off the question</option>
                        <option value="unclear" disabled={s.unclear.includes(p.id)}>Unclear</option>
                      </select>}
                      {!locked && <span className="hidden text-[12px] text-ink-faint lg:group-hover:inline">or drag to a position</span>}
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
            <li key={c.id} {...(locked ? {} : dropProps(c.id))} className={`border p-3 ${over === c.id ? "border-ink bg-surface" : "border-line"}`}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[13px] font-semibold">{letter(i)}</span>
                {!locked && <span className="flex gap-2 text-[12px] text-ink-faint">
                  <button onClick={() => move(c.id, -1)} disabled={i === 0} className="hover:text-ink disabled:opacity-30" aria-label="Move up">↑</button>
                  <button onClick={() => move(c.id, 1)} disabled={i === s.categories.length - 1} className="hover:text-ink disabled:opacity-30" aria-label="Move down">↓</button>
                  <button onClick={() => del(c)} className="hover:text-period">Delete</button>
                </span>}
              </div>
              <Field label="Implied answer" readOnly={locked} value={c.claim} autoFocus={focus === c.id} placeholder="What these passages imply about our question, in our words" onChange={(v) => edit(c.id, "claim", v)} />
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-[11px] tracking-wider text-ink-faint uppercase">Direction</span>
                {(["yes", "no", "other"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(c.id, d)}
                    disabled={locked}
                    aria-pressed={c.direction === d}
                    className={`border px-2 py-0.5 font-mono text-[12px] ${c.direction === d ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"}`}
                  >
                    {labels[d]}
                  </button>
                ))}
              </div>
              <Field label="Argument in the text" readOnly={locked} value={c.reason} placeholder="The reason the passages give" onChange={(v) => edit(c.id, "reason", v)} />
              {mode !== "sort" && (
                <Field label="Note" readOnly={locked} value={c.note ?? ""} placeholder={mode === "reference" ? "How you settled the difference between your lists" : "How this was settled; name Opus or Sol for agent-only additions"} onChange={(v) => edit(c.id, "note", v)} />
              )}
              <ul className="mt-2 flex min-h-9 flex-wrap gap-1.5 border border-dashed border-line p-1.5">
                {c.passages.map((pid) => chip(pid, c.id))}
                {!c.passages.length && <li className="self-center px-1 text-[12.5px] text-ink-faint">Drop passages here</li>}
              </ul>
            </li>
          ))}
        </ol>
        {!locked && (
          <button onClick={() => newCategory()} disabled={full} className="mt-4 w-full border border-rule py-2 font-mono text-[13px] hover:bg-surface disabled:opacity-40">
            {full ? `${max} positions is the limit` : "+ New position"}
          </button>
        )}

        {(["off", "unclear"] as const).map((b) => (
          <div key={b} {...(locked ? {} : dropProps(b))} className={`mt-4 border p-3 ${over === b ? "border-ink bg-surface" : "border-line"}`}>
            <p className="text-[13.5px] font-medium">{label(b)}</p>
            <p className="text-[12.5px] text-ink-faint">
              {b === "off" ? "The passage is not about this question, or it is about a different question." : "You can’t tell what answer it gives."}
            </p>
            <ul className="mt-2 flex min-h-9 flex-wrap gap-1.5 border border-dashed border-line p-1.5">
              {s[b].map((pid) => chip(pid, b))}
            </ul>
          </div>
        ))}

        {saveError && <p role="alert" className="mt-3 text-[14px] text-period">{saveError} <button onClick={() => setS((x) => ({ ...x }))} className="underline">Retry save</button></p>}
        <div className="mt-6 border-t border-rule pt-4">
          {mode !== "sort" ? footer : locked ? (
            <p className="text-[14.5px]">
              All independent sortings are locked.{" "}
              <Link href={`/keys/${q.toLowerCase()}/agreement`} className="text-modern hover:underline">Agreement →</Link>
            </p>
          ) : (
            <>
              <label className="flex items-start gap-2 text-[14.5px]">
                <input type="checkbox" className="mt-1" checked={s.done} disabled={!s.done && missing.length > 0} onChange={(e) => update((x) => ({ ...x, done: e.target.checked }))} />
                <span>
                  I have finished this question.
                  <span className="block text-[13px] text-ink-faint">
                    {missing.length && !s.done
                      ? `Still to do: ${missing.join("; ")}.`
                      : "Marked finished. You can keep editing until all four have finished."}
                  </span>
                </span>
              </label>
              {footer}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, autoFocus, readOnly }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; readOnly?: boolean }) {
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
        maxLength={label === "Implied answer" ? 600 : 1200}
        autoFocus={autoFocus}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full resize-none border-b border-line bg-transparent py-1 text-[14.5px] leading-snug outline-none placeholder:text-ink-faint focus:border-ink"
      />
    </label>
  );
}

function boxesIn(x: Sorting, pid: string): Box[] {
  return [...x.categories.filter((c) => c.passages.includes(pid)).map((c) => c.id), ...(x.off.includes(pid) ? ["off"] : []), ...(x.unclear.includes(pid) ? ["unclear"] : [])];
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
