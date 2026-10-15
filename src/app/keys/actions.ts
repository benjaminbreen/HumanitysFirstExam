"use server";

import { currentCoder } from "@/lib/coding";
import { getPool, reconciliationFor, saveReconciliation, saveSorting, type Reconciliation, type Sorting } from "@/lib/keys";

export async function saveSortingAction(q: string, s: Sorting) {
  const coder = await currentCoder();
  if (!coder) throw new Error("Not signed in");
  if (!getPool(q)) throw new Error("Unknown question");
  return saveSorting(coder, q, s);
}

export async function saveDecisionAction(q: string, row: string, d: Reconciliation[string]) {
  const coder = await currentCoder();
  if (!coder) throw new Error("Not signed in");
  if (!getPool(q)) throw new Error("Unknown question");
  const all = await reconciliationFor(coder, q);
  all[String(row).slice(0, 60)] = { decision: d.decision, note: String(d.note ?? "").slice(0, 2000) };
  await saveReconciliation(coder, q, all);
}
