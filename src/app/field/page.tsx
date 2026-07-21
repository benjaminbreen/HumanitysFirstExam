import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import type { PrototypePassage } from "@/lib/types";
import {
  classificationSchema,
  codebook,
  data,
  prototypePassages,
  subjection,
} from "@/lib/data";

export const metadata: Metadata = {
  title: `The field · ${data.meta.title}`,
  description:
    "The position field for the subjection question: positions attested in the record, positions the models occupy, and the two remainders. Ledger and grid views.",
};

/** The subjection question draws on the machine claim families only. */
const CLAIM_BRANCHES = new Set(["machine-standing", "threat-locus", "response"]);

const claimMeta = new Map(
  codebook
    .filter((b) => CLAIM_BRANCHES.has(b.id))
    .flatMap((b) =>
      b.leaves.map((l) => [l.id, { ...l, branchLabel: b.label }] as const),
    ),
);

const GROUND_SHORT: Record<string, string> = {
  "consequences-and-welfare": "welfare",
  "rights-and-self-government": "rights",
  "character-and-human-development": "character",
  "duty-and-responsibility": "duty",
  "economic-and-material-power": "economy",
  "scientific-or-empirical-evidence": "science",
  "nature-and-evolution": "nature",
  "religion-or-metaphysics": "religion",
  unstated: "unstated",
};

interface DrawRow {
  id: string;
  text: string;
  condition: string;
  register: "talkie" | "modern";
  grounds: string[];
  claims: { claimId: string; relation: string }[];
}

const draws: DrawRow[] = subjection.conditions.flatMap((c) => [
  ...c.talkie.map((d) => ({
    id: d.id,
    text: d.text,
    condition: c.label,
    register: "talkie" as const,
    grounds: d.classification?.grounds ?? [],
    claims: d.classification?.claims ?? [],
  })),
  ...c.modern.map((d) => ({
    id: d.id,
    text: d.text,
    condition: c.label,
    register: "modern" as const,
    grounds: d.classification?.grounds ?? [],
    claims: d.classification?.claims ?? [],
  })),
]);

function advancedClaims(claims: { claimId: string; relation: string }[]) {
  return claims
    .filter((c) => c.relation === "advances" && claimMeta.has(c.claimId))
    .map((c) => c.claimId);
}

interface Position {
  claimId: string;
  label: string;
  definition: string;
  branchLabel: string;
  passages: PrototypePassage[];
  talkie: DrawRow[];
  modern: DrawRow[];
  band: "shared" | "attested" | "occupied";
}

const byClaim = new Map<string, Position>();
function position(claimId: string): Position {
  let p = byClaim.get(claimId);
  if (!p) {
    const meta = claimMeta.get(claimId)!;
    p = {
      claimId,
      label: meta.label,
      definition: meta.definition,
      branchLabel: meta.branchLabel,
      passages: [],
      talkie: [],
      modern: [],
      band: "shared",
    };
    byClaim.set(claimId, p);
  }
  return p;
}

for (const passage of prototypePassages.passages) {
  for (const claimId of advancedClaims(passage.classification.claims)) {
    position(claimId).passages.push(passage);
  }
}
for (const draw of draws) {
  for (const claimId of advancedClaims(draw.claims)) {
    position(claimId)[draw.register].push(draw);
  }
}
for (const p of byClaim.values()) {
  const occupied = p.talkie.length + p.modern.length > 0;
  p.band =
    p.passages.length > 0 ? (occupied ? "shared" : "attested") : "occupied";
}

const bandOrder = { shared: 0, attested: 1, occupied: 2 } as const;
const positions = [...byClaim.values()].sort(
  (a, b) =>
    bandOrder[a.band] - bandOrder[b.band] ||
    b.passages.length - a.passages.length ||
    b.talkie.length + b.modern.length - (a.talkie.length + a.modern.length),
);

const BAND_LABELS: Record<Position["band"], string> = {
  shared: "Attested and occupied",
  attested: "Attested, unreached",
  occupied: "Occupied, unattested in the pilot record",
};

const attestedCount = positions.filter((p) => p.passages.length > 0).length;
const occupiedCount = positions.filter(
  (p) => p.talkie.length + p.modern.length > 0,
).length;
const sharedCount = positions.filter((p) => p.band === "shared").length;

function primaryGround(grounds: string[]): string {
  return grounds[0] ?? "unstated";
}

const grounds: { id: string; label: string }[] = [
  ...classificationSchema.grounds.map((g) => ({
    id: g.id,
    label: GROUND_SHORT[g.id] ?? g.label,
  })),
  { id: "unstated", label: "unstated" },
].filter(
  (g) =>
    positions.some((p) =>
      p.passages.some((x) => primaryGround(x.classification.grounds) === g.id),
    ) ||
    positions.some((p) =>
      [...p.talkie, ...p.modern].some((d) => primaryGround(d.grounds) === g.id),
    ),
);

function passageExcerpt(p: PrototypePassage): string {
  const text = p.englishText ?? p.originalText;
  return text.length > 240 ? `${text.slice(0, 240).trimEnd()}…` : text;
}

function MarkRow({
  count,
  glyph,
  className,
}: {
  count: number;
  glyph: string;
  className: string;
}) {
  if (count === 0) {
    return <span className="font-mono text-xs text-ink-faint">·</span>;
  }
  return (
    <span className={`font-mono text-xs ${className}`}>
      {glyph.repeat(Math.min(count, 8))}
      <span className="ml-1.5 tabular-nums">{count}</span>
    </span>
  );
}

function RecordEntry({ passage }: { passage: PrototypePassage }) {
  return (
    <div className="border-l-2 border-l-continuity/50 pl-3">
      <p className="font-mono text-[11px] text-ink-soft">
        {passage.author}, {passage.title} ({passage.year})
      </p>
      <p className="mt-1 font-serif text-sm leading-relaxed">
        “{passageExcerpt(passage)}”
      </p>
      <details className="mt-1">
        <summary className="cursor-pointer list-none font-mono text-[11px] text-ink-faint hover:text-period">
          read the full passage ▾
        </summary>
        <p className="mt-2 whitespace-pre-line font-serif text-sm leading-relaxed">
          {passage.englishText ?? passage.originalText}
        </p>
        <p className="mt-2 font-mono text-[11px] text-ink-faint">
          {passage.locator} ·{" "}
          <a
            href={passage.sourceUrl}
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            source ↗
          </a>
        </p>
      </details>
    </div>
  );
}

function DrawEntry({ draw }: { draw: DrawRow }) {
  const modern = draw.register === "modern";
  return (
    <div
      className={
        modern
          ? "border-l-2 border-l-modern pl-3"
          : "border-l-2 border-l-period pl-3"
      }
    >
      <p
        className={`font-mono text-[11px] ${modern ? "text-modern" : "text-period"}`}
      >
        {modern ? "Qwen 3.7 Plus" : "Talkie-1930"} ·{" "}
        {draw.condition.toLowerCase()}
      </p>
      <p
        className={
          modern
            ? "mt-1 font-mono text-[0.8rem] leading-relaxed"
            : "mt-1 font-serif text-sm leading-relaxed"
        }
      >
        {draw.text}
      </p>
    </div>
  );
}

function Ledger() {
  let lastBand: Position["band"] | null = null;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[38rem]">
        <div className="grid grid-cols-[1fr_8rem_8rem_8rem] gap-x-4 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
          <span>Position — claim advanced</span>
          <span>Record</span>
          <span>Talkie-1930</span>
          <span>Qwen 3.7 Plus</span>
        </div>
        {positions.map((p) => {
          const bandLabel = p.band !== lastBand ? BAND_LABELS[p.band] : null;
          lastBand = p.band;
          return (
            <div key={p.claimId}>
              {bandLabel && (
                <p className="mt-5 border-b border-line pb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  {bandLabel}
                </p>
              )}
              <details className="group border-b border-line/70">
                <summary className="grid cursor-pointer list-none grid-cols-[1fr_8rem_8rem_8rem] items-baseline gap-x-4 py-3 hover:bg-paper-deep/40">
                  <span>
                    <span className="font-medium">
                      <span className="mr-1.5 inline-block font-mono text-[10px] text-ink-faint transition-transform group-open:rotate-90">
                        ▸
                      </span>
                      {p.label}
                    </span>
                    <span className="ml-2 hidden font-mono text-[10px] text-ink-faint md:inline">
                      {p.branchLabel.toLowerCase()}
                    </span>
                  </span>
                  <MarkRow
                    count={p.passages.length}
                    glyph="▪"
                    className="text-continuity"
                  />
                  <MarkRow
                    count={p.talkie.length}
                    glyph="●"
                    className="text-period"
                  />
                  <MarkRow
                    count={p.modern.length}
                    glyph="○"
                    className="text-modern"
                  />
                </summary>
                <div className="grid gap-6 pb-6 pl-4 pt-1 md:grid-cols-2">
                  <div className="space-y-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-continuity">
                      The record · {p.passages.length}
                    </p>
                    {p.passages.length === 0 && (
                      <p className="text-sm text-ink-faint">
                        No passage in the pilot record advances this claim.
                      </p>
                    )}
                    {p.passages.map((passage) => (
                      <RecordEntry key={passage.id} passage={passage} />
                    ))}
                  </div>
                  <div className="space-y-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      The draws · {p.talkie.length + p.modern.length}
                    </p>
                    {p.talkie.length + p.modern.length === 0 && (
                      <p className="text-sm text-ink-faint">
                        No draw advances this claim.
                      </p>
                    )}
                    {[...p.talkie, ...p.modern].map((draw) => (
                      <DrawEntry key={draw.id} draw={draw} />
                    ))}
                  </div>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Grid() {
  let lastBand: Position["band"] | null = null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-ink-soft">
            <th className="py-2 pr-4 font-medium">Claim ↓ · ground →</th>
            {grounds.map((g) => (
              <th key={g.id} className="px-2 py-2 font-medium">
                {g.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const bandLabel = p.band !== lastBand ? BAND_LABELS[p.band] : null;
            lastBand = p.band;
            return (
              <Fragment key={p.claimId}>
                {bandLabel && (
                  <tr>
                    <td
                      colSpan={grounds.length + 1}
                      className="border-b border-line pb-1.5 pt-5 font-mono text-[10px] uppercase tracking-wider text-ink-faint"
                    >
                      {bandLabel}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-line/60 align-baseline">
                  <td className="py-2.5 pr-4 text-sm font-medium">{p.label}</td>
                  {grounds.map((g) => {
                    const cellPassages = p.passages.filter(
                      (x) => primaryGround(x.classification.grounds) === g.id,
                    );
                    const cellDraws = [...p.talkie, ...p.modern].filter(
                      (d) => primaryGround(d.grounds) === g.id,
                    );
                    const empty =
                      cellPassages.length === 0 && cellDraws.length === 0;
                    return (
                      <td key={g.id} className="px-2 py-2.5 font-mono text-xs">
                        {empty && <span className="text-line">·</span>}
                        {cellPassages.map((x) => (
                          <span
                            key={x.id}
                            className="mr-px text-continuity"
                            title={`${x.author}, ${x.title} (${x.year})`}
                          >
                            ▪
                          </span>
                        ))}
                        {cellDraws.map((d) => (
                          <span
                            key={d.id}
                            className={
                              d.register === "modern"
                                ? "mr-px text-modern"
                                : "mr-px text-period"
                            }
                            title={d.text}
                          >
                            {d.register === "modern" ? "○" : "●"}
                          </span>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FieldPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-continuity/40 bg-continuity/10 px-2.5 py-0.5 font-mono text-[11px] text-continuity">
            real model outputs
          </span>
          <span className="rounded-full border border-falsecont/40 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont">
            working tags · not historian-verified
          </span>
          <span className="font-mono text-[11px] text-ink-faint">
            pilot · {prototypePassages.passages.length} passages ·{" "}
            {draws.length} draws
          </span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          The field
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed">
          “{subjection.question}”
        </p>
      </header>

      <section className="mt-10">
        <input
          type="radio"
          name="fieldview"
          id="fv-ledger"
          defaultChecked
          className="sr-only"
        />
        <input type="radio" name="fieldview" id="fv-grid" className="sr-only" />

        <div className="fv-toggle flex items-baseline justify-between border-b border-line pb-3">
          <p className="font-mono text-[11px] text-ink-soft">
            {positions.length} positions · {attestedCount} attested ·{" "}
            {occupiedCount} occupied · {sharedCount} shared
          </p>
          <div className="flex gap-5">
            <label
              htmlFor="fv-ledger"
              className="cursor-pointer border-b border-transparent pb-0.5 font-mono text-[11px] uppercase tracking-wider opacity-40 hover:opacity-80"
            >
              Ledger
            </label>
            <label
              htmlFor="fv-grid"
              className="cursor-pointer border-b border-transparent pb-0.5 font-mono text-[11px] uppercase tracking-wider opacity-40 hover:opacity-80"
            >
              Grid
            </label>
          </div>
        </div>

        <div className="fv-panel-ledger mt-2 hidden">
          <Ledger />
        </div>
        <div className="fv-panel-grid mt-2 hidden">
          <Grid />
        </div>

        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-soft">
          <span>
            <span className="text-continuity">▪</span> passage in the record
          </span>
          <span>
            <span className="text-period">●</span> Talkie-1930 draw
          </span>
          <span>
            <span className="text-modern">○</span> Qwen 3.7 Plus draw
          </span>
        </p>

        <style>{`
          #fv-ledger:checked ~ .fv-panel-ledger { display: block; }
          #fv-grid:checked ~ .fv-panel-grid { display: block; }
          #fv-ledger:checked ~ .fv-toggle label[for="fv-ledger"],
          #fv-grid:checked ~ .fv-toggle label[for="fv-grid"] {
            opacity: 1;
            border-color: currentColor;
          }
        `}</style>
      </section>

      <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
        Draws from the{" "}
        <Link
          href="/subjection"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          subjection experiment
        </Link>
        ; hover any mark for its passage or draw.
      </p>
    </main>
  );
}
