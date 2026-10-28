"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { complete, type Coder, type Direction, type JointKind, type JointList, type PoolPassage } from "@/lib/key-model";
import { approveJointAction } from "../actions";
import { Board } from "./Board";

export function JointEditor({ q, kind, passages, initial, labels, me, max }: {
  q: string; kind: JointKind; passages: PoolPassage[]; initial: JointList; labels: Record<Direction, string>; me: Coder; max: number;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState(initial), [saving, setSaving] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const other = me === "ben" ? "nathan" : "ben";
  const label = kind === "reference" ? "human reference" : "final position key";
  const footer = doc.frozenAt ? <p className="text-[14.5px]">{kind === "reference" ? "Locked" : "Frozen"}, agreed by both historians. Version {doc.version}.</p> : <div className="space-y-2 text-[14.5px]">
    <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={Boolean(doc.agreed[me])} disabled={saving || busy || !complete(q, doc)} onChange={async (e) => {
      setBusy(true); setError("");
      try { const saved = await approveJointAction(q, kind, doc.version, e.target.checked); setDoc(saved); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Could not agree. Reload and try again."); }
      finally { setBusy(false); }
    }} /><span>I agree this is the {label}.<span className="block text-[13px] text-ink-faint">{saving ? "Wait for the changes to save." : !complete(q, doc) ? "Complete all positions and placements first." : `${other === "ben" ? "Ben" : "Nathan"} ${doc.agreed[other] ? "has agreed" : "has not agreed yet"}. Any edit clears both approvals.`}</span></span></label>
    {error && <p role="alert" className="text-period">{error}</p>}
  </div>;
  return <Board q={q} passages={passages} initial={initial} labels={labels} mode={kind} max={max} locked={Boolean(doc.frozenAt) || busy} footer={footer}
    onSaved={(saved) => setDoc(saved as JointList)} onSavingChange={setSaving} />;
}
