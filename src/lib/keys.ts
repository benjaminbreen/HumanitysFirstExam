import "server-only";
import { currentCoder, type Coder } from "@/lib/coding";
import { inputVersion, readStudy, updateStudy } from "./key-store";
import {
  agentConfig, agents, agentNames, agentsOpen, allIndependentDone, allReferencesLocked, allReviewsLocked,
  complete, content, emptyJoint, emptyReview, emptySorting, getPool, humansOpen, instructions,
  jointLocked, pools, reviewCounts, reviewLocked, reviewsLocked, validateSorting,
  type Agent, type AgentRun, type DefinitionReview, type JointKind, type Sorting, type Study,
} from "./key-model";
export * from "./key-model";
export { inputVersion } from "./key-store";

async function reader() {
  const coder = await currentCoder();
  if (!coder) throw new Error("Sign in to use the position keys");
  return coder;
}
function version(actual: number, expected: number) {
  if (!Number.isSafeInteger(expected) || expected < 0 || actual !== expected) throw new Error("This version has changed. Reload before saving or agreeing.");
}
function requireHumans(s: Study) {
  if (!humansOpen(s)) throw new Error("All four must finish sorting and Ben must write the pass mark first");
}
function requireAgents(s: Study) {
  if (!agentsOpen(s)) throw new Error("Agent results stay hidden until both historians lock all six human references");
}
function question(q: string) { if (!getPool(q)) throw new Error("Unknown question"); }
function requireJoint(s: Study, q: string, kind: JointKind) {
  if (kind !== "reference" && kind !== "final") throw new Error("Unknown list");
  requireHumans(s);
  if (kind === "final") {
    requireAgents(s);
    if (!reviewsLocked(s, q) || agents.some((a) => !s.decisions[a])) throw new Error("Agree both definition reviews and record both further-use decisions before making the final key");
  }
}
const jointMap = (s: Study, kind: JointKind) => kind === "reference" ? s.references : s.finals;

// Return only the current reader's categories before human comparisons open.
// Agent metadata/content and the other historian's category counts are absent.
export async function dashboard() {
  const coder = await reader(), s = await readStudy();
  const human = humansOpen(s), revealed = agentsOpen(s);
  const status = pools.map((p) => ({
    question: p.question,
    mine: s.sortings[coder][p.question] ?? emptySorting(),
    benDone: Boolean(s.sortings.ben[p.question]?.done), nathanDone: Boolean(s.sortings.nathan[p.question]?.done),
    reference: human ? (s.references[p.question]?.frozenAt ? "Locked" : s.references[p.question]?.started ? "In progress" : "Not started") : null,
    final: revealed ? (s.finals[p.question]?.frozenAt ? "Frozen" : s.finals[p.question]?.started ? "In progress" : "Not started") : null,
    reviews: revealed ? agents.map((a) => ({ agent: a, locked: reviewLocked(s.reviews[p.question]?.[a]) })) : null,
  }));
  return { coder, status, rule: s.rule, independentLocked: Boolean(s.independentLockedAt), human, revealed,
    agentReceived: Object.fromEntries(agents.map((a) => [a, Boolean(s.runs[a])])) as Record<Agent, boolean>,
    referencesLocked: human ? pools.filter((p) => jointLocked(p.question, s.references[p.question])).length : 0,
    decisions: revealed ? s.decisions : {}, canDecide: revealed && allReviewsLocked(s),
  };
}
export async function sortingFor(q: string) {
  question(q);
  const coder = await reader(), s = await readStudy();
  return { sorting: s.sortings[coder][q] ?? emptySorting(), locked: Boolean(s.independentLockedAt) };
}
export async function saveSorting(q: string, value: Sorting, expected: number) {
  question(q);
  const coder = await reader(), tidy = validateSorting(q, value);
  if (tidy.done && !complete(q, tidy)) throw new Error("Place every passage and write an answer, reason and direction for every position first");
  return updateStudy((s, now) => {
    if (s.independentLockedAt) throw new Error("All independent sortings are locked");
    version(s.sortings[coder][q]?.version ?? 0, expected);
    const next = { ...tidy, savedAt: now, version: expected + 1 };
    s.sortings[coder][q] = next;
    return next;
  });
}
export async function recordRule(text: string, expected: number) {
  if ((await reader()) !== "ben") throw new Error("Only Ben writes the pass mark");
  if (typeof text !== "string" || !text.trim() || text.length > 6000) throw new Error("Write the pass mark");
  await updateStudy((s, now) => {
    if (s.humanOpenedAt) throw new Error("The pass mark can’t change after the scores open");
    version(s.rule?.version ?? 0, expected);
    s.rule = { text: text.trim(), version: expected + 1, recordedAt: now };
  });
}
export async function comparison(q?: string) {
  await reader();
  if (q) question(q);
  const s = await readStudy();
  requireHumans(s);
  return { ben: s.sortings.ben, nathan: s.sortings.nathan, runs: agentsOpen(s) ? s.runs : null };
}
export async function jointFor(q: string, kind: JointKind) {
  await reader(); question(q);
  const s = await readStudy(); requireJoint(s, q, kind);
  return jointMap(s, kind)[q] ?? emptyJoint();
}
export async function startJoint(q: string, kind: JointKind, from: Coder) {
  await reader(); question(q);
  if (!["ben", "nathan"].includes(from)) throw new Error("Choose a historian's list");
  await updateStudy((s, now) => {
    requireJoint(s, q, kind);
    const target = jointMap(s, kind);
    if (target[q]?.started) throw new Error("This list has already been started. Reload it.");
    const source = kind === "reference" ? s.sortings[from][q] : s.references[q];
    target[q] = { ...emptyJoint(), ...structuredClone(source), started: true, done: false, agreed: {}, frozenAt: null, savedAt: now, version: 1 };
  });
}
export async function saveJoint(q: string, kind: JointKind, value: Sorting, expected: number) {
  await reader(); question(q);
  const tidy = validateSorting(q, value);
  return updateStudy((s, now) => {
    requireJoint(s, q, kind);
    const old = jointMap(s, kind)[q] ?? emptyJoint();
    version(old.version, expected);
    if (!old.started || old.frozenAt) throw new Error("This list has not been started or is already locked");
    if (content(old) === content(tidy)) return old;
    const next = { ...tidy, started: true, agreed: {}, frozenAt: null, savedAt: now, version: expected + 1, done: false };
    jointMap(s, kind)[q] = next;
    return next;
  });
}
export async function approveJoint(q: string, kind: JointKind, expected: number, yes: boolean) {
  const coder = await reader(); question(q);
  return updateStudy((s, now) => {
    requireJoint(s, q, kind);
    const f = jointMap(s, kind)[q];
    if (!f?.started) throw new Error("Start the list first");
    version(f.version, expected);
    if (f.frozenAt) throw new Error("This list is already locked");
    if (yes && !complete(q, f)) throw new Error("Complete the positions and placements first");
    if (yes) f.agreed[coder] = { at: now, version: expected }; else delete f.agreed[coder];
    if (f.agreed.ben?.version === expected && f.agreed.nathan?.version === expected) f.frozenAt = now;
    return f;
  });
}

// This is the only ingestion path for independent runs. It is called by the
// token-authenticated import endpoint, never by a historian-facing upload form.
export async function importAgentRun(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid run");
  const r = value as AgentRun;
  if (!agents.includes(r.agent) || r.inputVersion !== inputVersion || r.instructionsVersion !== instructions.version || r.independent !== true ||
    typeof r.model !== "string" || !r.model.trim() || r.model.length > 200 || !r.settings || Array.isArray(r.settings) || typeof r.settings !== "object" ||
    typeof r.createdAt !== "string" || !Number.isFinite(Date.parse(r.createdAt)) || typeof r.exposureNote !== "string" || !r.exposureNote.trim() || r.exposureNote.length > 3000 ||
    typeof r.originalOutput !== "string" || r.originalOutput.length > 500000) throw new Error("Provide the current inputs, exact model, settings, date and independent-run provenance");
  if (r.model !== agentConfig[r.agent].model || r.settings.effort !== agentConfig[r.agent].effort) {
    throw new Error(`This study requires ${agentConfig[r.agent].model} at medium effort. Preserve outputs from other configurations as separate records.`);
  }
  let raw;
  try { raw = JSON.parse(r.originalOutput); } catch { throw new Error("originalOutput must contain the exact JSON response, without markdown fences"); }
  if (!raw || typeof raw !== "object" || Object.keys(raw).length !== pools.length) throw new Error("The original output must contain exactly the six question sortings");
  const sortings: Record<string, Sorting> = {};
  for (const p of pools) {
    const sorting = validateSorting(p.question, raw[p.question]);
    if (!complete(p.question, sorting)) throw new Error(`The original ${p.question} sorting is incomplete or invalid; preserve it and obtain a qualifying run`);
    sortings[p.question] = { ...sorting, done: true, version: 1, savedAt: r.createdAt };
  }
  await updateStudy((s, now) => {
    if (s.runs[r.agent] || s.independentLockedAt) throw new Error("This agent run is already recorded or independent sorting has locked. Original runs cannot be replaced.");
    s.runs[r.agent] = { agent: r.agent, model: r.model.trim(), settings: r.settings, createdAt: r.createdAt, inputVersion, instructionsVersion: instructions.version, independent: true, exposureNote: r.exposureNote, originalOutput: r.originalOutput, sortings, receivedAt: now };
  });
}
export async function reviewFor(q: string) {
  await reader(); question(q);
  const s = await readStudy(); requireAgents(s);
  return { reference: s.references[q], runs: s.runs as Record<Agent, AgentRun>, reviews: s.reviews[q] ?? {}, decisions: s.decisions };
}
function validateReview(q: string, a: Agent, value: DefinitionReview, s: Study) {
  const f = s.references[q], run = s.runs[a]!;
  const result = emptyReview();
  const catIds = new Set(run.sortings[q].categories.map((c) => c.id));
  const note = (x: unknown) => { if (typeof x !== "string" || x.length > 3000) throw new Error("Review notes must be text under 3000 characters"); return x.trim(); };
  for (const c of run.sortings[q].categories) {
    const j = value.categories?.[c.id];
    if (!j || !["supported", "unsupported", "discovery", "unresolved"].includes(j.status)) throw new Error("Judge every agent position or mark it unresolved");
    result.categories[c.id] = { status: j.status, note: note(j.note) };
    if (j.status !== "unresolved" && !result.categories[c.id].note) throw new Error("Explain each resolved judgment in its note");
  }
  for (const c of f.categories) {
    const j = value.reference?.[c.id];
    if (!j || !["recovered", "missed", "unresolved"].includes(j.status) || !Array.isArray(j.matches) || new Set(j.matches).size !== j.matches.length || j.matches.some((id) => !catIds.has(id))) throw new Error("Judge every reference position and use valid agent position IDs");
    if ((j.status === "recovered") !== Boolean(j.matches.length)) throw new Error("Recovered positions need matching IDs; missed or unresolved positions must have none");
    if (j.matches.some((id) => result.categories[id].status !== "supported")) throw new Error("A recovered position must match supported agent positions, not discoveries or unsupported positions");
    result.reference[c.id] = { status: j.status, matches: j.matches, note: note(j.note) };
    if (j.status !== "unresolved" && !result.reference[c.id].note) throw new Error("Explain each resolved judgment in its note");
  }
  result.notes = note(value.notes);
  return result;
}
export async function saveReview(q: string, a: Agent, value: DefinitionReview, expected: number) {
  await reader(); question(q); if (!agents.includes(a)) throw new Error("Unknown agent");
  await updateStudy((s, now) => {
    requireAgents(s);
    const old = s.reviews[q]?.[a] ?? emptyReview(); version(old.version, expected);
    if (old.frozenAt) throw new Error("This review is already locked");
    const next = validateReview(q, a, value, s);
    s.reviews[q] ??= {};
    s.reviews[q][a] = { ...next, savedAt: now, version: expected + 1 };
  });
}
export async function approveReview(q: string, a: Agent, expected: number, yes: boolean, submitted: DefinitionReview) {
  const coder = await reader(); question(q); if (!agents.includes(a)) throw new Error("Unknown agent");
  await updateStudy((s, now) => {
    requireAgents(s);
    const r = s.reviews[q]?.[a];
    if (!r) throw new Error("Save the review first");
    version(r.version, expected);
    if (r.frozenAt) throw new Error("The review is already locked");
    const normalized = validateReview(q, a, submitted, s);
    const previous = validateReview(q, a, r, s);
    if (JSON.stringify(normalized) !== JSON.stringify(previous)) throw new Error("Save your review changes before agreeing");
    if (yes) r.agreed[coder] = { at: now, version: expected }; else delete r.agreed[coder];
    if (r.agreed.ben?.version === expected && r.agreed.nathan?.version === expected) r.frozenAt = now;
  });
}
export async function recordDecision(a: Agent, outcome: string, reason: string) {
  if ((await reader()) !== "ben") throw new Error("Ben records the further-use decisions");
  if (!agents.includes(a) || !["use", "revise", "inconclusive"].includes(outcome) || typeof reason !== "string" || !reason.trim() || reason.length > 6000) throw new Error("Choose an outcome and explain how the pass mark applies");
  await updateStudy((s, now) => {
    requireAgents(s);
    if (!allReviewsLocked(s)) throw new Error("Both historians must agree all definition reviews first");
    if (s.decisions[a]) throw new Error("This decision is already recorded");
    s.decisions[a] = { outcome: outcome as "use" | "revise" | "inconclusive", reason: reason.trim(), recordedAt: now };
  });
}
export { agentNames, allIndependentDone, allReferencesLocked, reviewCounts };
