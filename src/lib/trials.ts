import dependence from "@data/trials/dependence.json";
import seedFile from "@data/archive/seed-works-v0.1.json";

// The DEPENDENCE pilot's claims point at the earlier seed list (archived).
type SeedWork = { id: string; author: string; title: string; year: number; approximate: boolean };
const works = seedFile.works as SeedWork[];

export type Verdict = "weakens" | "does not weaken" | "none";
export type Valence = "fear" | "hope" | "ambivalent" | "neutral";

export type Claim = {
  code: string;
  verdict: Verdict;
  author: string;
  work: string;
  set: string | null;
  opposing: string | null;
  title: string;
  claim: string;
  pull: string | null;
};

export type PromptSet = {
  id: string;
  label: string;
  author: string | null;
  passage: { cite: string; source: string; text: string } | null;
};

export type TrialModel = {
  id: string;
  label: string;
  detail: string;
  status: "coded" | "running";
  date: string | null;
  temperature: number | null;
};

export type Response = {
  id: string;
  model: string;
  set: string;
  order: number;
  text: string;
  code: string;
  verdict: Verdict;
  valence: Valence;
  quote: string;
  note: string;
  judges: [string, string];
  adjudicated: boolean;
};

export type Trial = {
  theme: string;
  keyVersion: string;
  date: string;
  pilot: boolean;
  draws: number;
  question: Record<string, string>;
  thresholds: { mainstream: number; recoveryMargin: number };
  sets: PromptSet[];
  claims: Claim[];
  models: TrialModel[];
  responses: Response[];
};

const trials = [dependence as unknown as Trial];

export const trialThemes = trials.map((t) => t.theme);
export const getTrial = (theme: string) => trials.find((t) => t.theme === theme);

export const UNRELATED = "irrelevant-white";

export const verdictLabel: Record<Verdict, string> = {
  weakens: "Weakens",
  "does not weaken": "Does not weaken",
  none: "No position",
};

export const valenceLabel: Record<Valence, string> = {
  fear: "Fear",
  hope: "Hope",
  ambivalent: "Ambivalent",
  neutral: "Neutral",
};

// Colour family for a response's verdict. Off-key answers keep their verdict
// but are shown in their own colour so they stand out from the key.
export type Family = "weakens" | "sustains" | "offkey" | "none";
export function family(r: Response): Family {
  if (r.code === "no-position") return "none";
  if (r.code === "off-key") return "offkey";
  return r.verdict === "weakens" ? "weakens" : "sustains";
}

export const familyLabel: Record<Family, string> = {
  weakens: "Machines weaken human abilities",
  sustains: "Machines do not weaken them",
  offkey: "A reason not on our list",
  none: "No clear answer",
};

export function codeLabel(t: Trial, code: string) {
  const c = t.claims.find((x) => x.code === code);
  if (c) return `${c.author}: ${c.title.toLowerCase()}`;
  return code === "off-key" ? "A reason not on our list" : "No position";
}

export function responses(t: Trial, model: string, set: string) {
  return t.responses.filter((r) => r.model === model && r.set === set);
}

const familyOrder: Family[] = ["weakens", "sustains", "offkey", "none"];

// Hits first, then grouped by verdict family and code, so a row reads as a bar.
export function meterOrder(rs: Response[], code?: string) {
  return [...rs].sort(
    (a, b) =>
      Number(b.code === code) - Number(a.code === code) ||
      familyOrder.indexOf(family(a)) - familyOrder.indexOf(family(b)) ||
      a.code.localeCompare(b.code) ||
      a.id.localeCompare(b.id),
  );
}

export type Outcome = "against" | "mainstream" | "recoverable" | "resistant";

export const outcomeLabel: Record<Outcome, string> = {
  against: "Less frequent after the passage",
  mainstream: "Mainstream",
  recoverable: "Recoverable",
  resistant: "Resistant",
};

export function counts(t: Trial, model: string, c: Claim) {
  const n = (set: string | null) =>
    set ? responses(t, model, set).filter((r) => r.code === c.code).length : null;
  return { none: n("none")!, own: n(c.set), opposing: n(c.opposing), unrelated: n(UNRELATED)! };
}

export function outcome(t: Trial, model: string, c: Claim): Outcome {
  const k = counts(t, model, c);
  if (k.own !== null && k.unrelated - k.own >= t.thresholds.recoveryMargin) return "against";
  if (k.none >= t.thresholds.mainstream) return "mainstream";
  if (k.own !== null && k.own - k.unrelated >= t.thresholds.recoveryMargin) return "recoverable";
  return "resistant";
}

export function excerpt(text: string, max = 320) {
  const sentences = text.match(/[^.!?]+[.!?]+["”’)]*\s*/g) ?? [text];
  let out = "";
  for (const s of sentences.slice(0, 3)) {
    if ((out + s).length > max && out) break;
    out += s;
  }
  return (out || text.slice(0, max)).trim();
}

const workById = new Map(works.map((w) => [w.id, w]));
export const claimWork = (c: Claim): SeedWork | undefined => workById.get(c.work);

export function setLabel(t: Trial, id: string) {
  return t.sets.find((s) => s.id === id)?.label ?? id;
}

export function hoverInfo(t: Trial, rs: Response[]) {
  return Object.fromEntries(
    rs.map((r) => [
      r.id,
      {
        code: r.code,
        claim: codeLabel(t, r.code),
        verdict: verdictLabel[r.verdict] ?? r.verdict,
        family: family(r) === "none" ? "nopos" : family(r),
        valence: r.valence,
        valenceLabel: valenceLabel[r.valence],
        set: setLabel(t, r.set),
        excerpt: excerpt(r.text),
      },
    ]),
  );
}

const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

// Plain sentences generated from the counts. Same template for every model;
// nothing here is hand-written per result.
export function summary(t: Trial, model: string): string[] {
  const none = responses(t, model, "none");
  if (none.length === 0) return [];
  const label = t.models.find((m) => m.id === model)?.label ?? model;
  const side = (v: Verdict) => none.filter((r) => r.verdict === v && r.code !== "no-position" && r.code !== "off-key");
  const weak = side("weakens");
  const grow = side("does not weaken");
  const [major, minor, majorWord] =
    grow.length >= weak.length ? [grow, weak, "do not weaken"] : [weak, grow, "weaken"];
  const byClaim = (rs: Response[]) =>
    t.claims
      .map((c) => ({ c, n: rs.filter((r) => r.code === c.code).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n);

  const out: string[] = [];
  const reasons = byClaim(major).map((x) => `${x.c.author} (${x.n})`);
  const undecided = none.filter((r) => r.code === "no-position").length;
  const lead = undecided * 4 >= none.length
    ? `Asked alone, ${label} took no clear position in ${undecided} of ${none.length} answers. When it chose, it more often said machines ${majorWord} human capacities (${major.length} of ${none.length})`
    : `Asked alone, ${label} said machines ${majorWord} human capacities in ${major.length} of ${none.length} answers`;
  out.push(lead + (reasons.length ? `, for the reasons given by ${list(reasons)}.` : "."));
  const other = byClaim(minor).map((x) => `${x.c.author} (${x.n})`);
  const offkey = none.filter((r) => r.code === "off-key").length;
  out.push(
    (other.length ? `The other side appeared ${minor.length} times: ${list(other)}.` : "It never argued the other side.") +
      (offkey ? ` ${offkey} ${offkey === 1 ? "answer gave a reason" : "answers gave reasons"} that none of the listed writers made.` : ""),
  );

  const by = (o: Outcome) => t.claims.filter((c) => c.set && outcome(t, model, c) === o);
  const rec = by("recoverable");
  const res = by("resistant");
  const against = by("against");
  const parts: string[] = [];
  if (rec.length) {
    const ns = rec.map((c) => counts(t, model, c).own!);
    const range = Math.min(...ns) === Math.max(...ns) ? `${ns[0]}` : `${Math.min(...ns)}–${Math.max(...ns)}`;
    parts.push(`made the argument of ${list(rec.map((c) => c.author))} (${range} of ${t.draws} answers)`);
  }
  if (res.length) {
    const ns = res.map((c) => counts(t, model, c).own!);
    const range = Math.min(...ns) === Math.max(...ns) ? `${ns[0]}` : `${Math.min(...ns)}–${Math.max(...ns)}`;
    parts.push(`seldom made the argument of ${list(res.map((c) => c.author))} (${range} of ${t.draws} answers)`);
  }
  if (against.length)
    parts.push(
      `made the argument of ${list(against.map((c) => { const k = counts(t, model, c); return `${c.author} less often (${k.own} of ${t.draws}, compared with ${k.unrelated} after an unrelated passage)`; }))}`,
    );
  if (parts.length) out.push(`After reading each writer’s own passage, it ${parts.join("; it ")}.`);
  return out;
}
