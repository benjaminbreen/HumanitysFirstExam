"use server";

import { redirect } from "next/navigation";
import { approveJoint, approveReview, getPool, recordDecision, recordRule, saveJoint, saveReview, saveSorting, startJoint, type Agent, type DefinitionReview, type JointKind, type Sorting } from "@/lib/keys";

const qFrom = (f: FormData) => {
  const q = String(f.get("q") ?? "");
  if (!getPool(q)) throw new Error("Unknown question");
  return q;
};
const kindFrom = (f: FormData): JointKind => {
  const kind = f.get("kind");
  if (kind !== "reference" && kind !== "final") throw new Error("Unknown list");
  return kind;
};
async function formResult(path: string, task: () => Promise<unknown>) {
  let error = "";
  try { await task(); } catch (e) { error = e instanceof Error ? e.message : "Could not save. Reload and try again."; }
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}
export async function saveSortingAction(q: string, s: Sorting, version: number) {
  return saveSorting(q, s, version);
}
export async function saveJointAction(q: string, kind: JointKind, s: Sorting, version: number) {
  if (kind !== "reference" && kind !== "final") throw new Error("Unknown list");
  return saveJoint(q, kind, s, version);
}
export async function approveJointAction(q: string, kind: JointKind, version: number, yes: boolean) {
  if (kind !== "reference" && kind !== "final") throw new Error("Unknown list");
  return approveJoint(q, kind, version, yes);
}
export async function startJointAction(form: FormData) {
  const q = qFrom(form), kind = kindFrom(form);
  const from = form.get("from");
  if (from !== "ben" && from !== "nathan") throw new Error("Choose a historian");
  await formResult(`/keys/${q.toLowerCase()}/${kind}`, () => startJoint(q, kind, from));
}
export async function recordRuleAction(form: FormData) {
  await formResult("/keys", () => recordRule(String(form.get("rule") ?? ""), Number(form.get("version"))));
}
function reviewFrom(form: FormData): DefinitionReview {
  const review: DefinitionReview = { reference: {}, categories: {}, notes: String(form.get("notes") ?? ""), version: 0, agreed: {}, frozenAt: null, savedAt: "" };
  for (const [name, value] of form.entries()) {
    if (name.startsWith("ref-status:")) {
      const id = name.slice(11);
      review.reference[id] = { status: String(value) as "recovered", matches: String(form.get(`ref-matches:${id}`) ?? "").split(",").map((s) => s.trim()).filter(Boolean), note: String(form.get(`ref-note:${id}`) ?? "") };
    }
    if (name.startsWith("cat-status:")) {
      const id = name.slice(11);
      review.categories[id] = { status: String(value) as "supported", note: String(form.get(`cat-note:${id}`) ?? "") };
    }
  }
  return review;
}
export async function saveReviewAction(form: FormData) {
  const q = qFrom(form), agent = String(form.get("agent")) as Agent;
  await formResult(`/keys/${q.toLowerCase()}/review`, () => saveReview(q, agent, reviewFrom(form), Number(form.get("version"))));
}
export async function approveReviewAction(form: FormData) {
  const q = qFrom(form);
  await formResult(`/keys/${q.toLowerCase()}/review`, () => approveReview(q, String(form.get("agent")) as Agent, Number(form.get("version")), true, reviewFrom(form)));
}
export async function withdrawReviewAction(form: FormData) {
  const q = qFrom(form);
  await formResult(`/keys/${q.toLowerCase()}/review`, () => approveReview(q, String(form.get("agent")) as Agent, Number(form.get("version")), false, reviewFrom(form)));
}
export async function recordDecisionAction(form: FormData) {
  await formResult("/keys", () => recordDecision(String(form.get("agent")) as Agent, String(form.get("outcome")), String(form.get("reason") ?? "")));
}
