"use client";

import { useState } from "react";
import type { Decision, Reconciliation } from "@/lib/keys";
import { saveDecisionAction } from "../../actions";

const OPTIONS: { v: Decision; label: string; both?: boolean; one?: boolean }[] = [
  { v: "same", label: "Same argument", both: true },
  { v: "merge", label: "Overlap: merge into one", both: true },
  { v: "distinct", label: "Different arguments: keep both", both: true },
  { v: "keep", label: "Keep in the key", one: true },
  { v: "drop", label: "Leave out", one: true },
];

// One decision per row, saved to the reader's record as it changes.
export function Decide({ q, row, both, initial }: { q: string; row: string; both: boolean; initial?: Reconciliation[string] }) {
  const [d, setD] = useState(initial ?? { decision: null, note: "" });
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const save = async (next: Reconciliation[string]) => {
    setD(next);
    setState("saving");
    try {
      await saveDecisionAction(q, row, next);
      setState("saved");
    } catch {
      setState("error");
    }
  };
  return (
    <div className="space-y-2">
      <select
        value={d.decision ?? ""}
        onChange={(e) => save({ ...d, decision: (e.target.value || null) as Decision | null })}
        className="w-full border border-line bg-bg px-1.5 py-1 text-[13.5px] hover:border-ink"
        aria-label="Decision"
      >
        <option value="">Decide…</option>
        {OPTIONS.filter((o) => (both ? o.both : o.one)).map((o) => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
      <textarea
        defaultValue={d.note}
        onBlur={(e) => e.target.value !== d.note && save({ ...d, note: e.target.value })}
        rows={2}
        placeholder="Why (optional)"
        className="w-full border border-line bg-bg px-1.5 py-1 text-[13.5px] leading-snug outline-none focus:border-ink"
      />
      <span className="font-mono text-[11px] text-ink-faint">{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Not saved" : ""}</span>
    </div>
  );
}
