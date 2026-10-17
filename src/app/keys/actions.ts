"use server";

import { redirect } from "next/navigation";
import { coders, currentCoder } from "@/lib/coding";
import { agreeFinal, bothDone, finalFor, getPool, saveFinal, saveSorting, sortingFor, type Sorting } from "@/lib/keys";

export async function saveSortingAction(q: string, s: Sorting) {
  const coder = await currentCoder();
  if (!coder) throw new Error("Not signed in");
  if (!getPool(q)) throw new Error("Unknown question");
  return saveSorting(coder, q, s);
}

export async function saveFinalAction(q: string, s: Sorting) {
  const coder = await currentCoder();
  if (!coder) throw new Error("Not signed in");
  if (!getPool(q) || !(await bothDone(q))) throw new Error("The final list is not open");
  return saveFinal(q, s);
}

export async function agreeFinalAction(q: string, yes: boolean) {
  const coder = await currentCoder();
  if (!coder) throw new Error("Not signed in");
  if (!getPool(q) || !(await bothDone(q))) throw new Error("The final list is not open");
  return agreeFinal(coder, q, yes);
}

export async function startFinalAction(formData: FormData) {
  const coder = await currentCoder();
  const q = String(formData.get("q") ?? "");
  const from = formData.get("from");
  if (!coder || !getPool(q) || !(await bothDone(q))) throw new Error("The final list is not open");
  const f = await finalFor(q);
  if (!f.categories.length && (from === "ben" || from === "nathan")) {
    const s = await sortingFor(from, q);
    await saveFinal(q, { ...s, categories: s.categories.map((c) => ({ ...c, note: `From ${coders[from].split(" ")[0]}’s list.` })) });
  }
  redirect(`/keys/${q.toLowerCase()}/final`);
}
