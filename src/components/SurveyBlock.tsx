"use client";

import { useMemo, useState } from "react";
import CodeChip from "@/components/CodeChip";
import type { Survey } from "@/lib/types";

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One model's sampled distribution on a topic: cluster bars, a draw-an-answer
 * control that enacts "one draw from a distribution", and the full sample
 * list. `register` controls the era styling.
 */
export default function SurveyBlock({
  survey,
  register,
}: {
  survey: Survey;
  register: "modern" | "period";
}) {
  const [order, setOrder] = useState<string[]>([]);
  const [drawCount, setDrawCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const clusterById = useMemo(
    () => new Map(survey.clusters.map((c) => [c.id, c])),
    [survey],
  );

  const currentSample =
    drawCount > 0
      ? survey.samples.find((s) => s.id === order[(drawCount - 1) % order.length])
      : undefined;

  function draw() {
    if (drawCount === 0 || drawCount % order.length === 0) {
      setOrder(shuffled(survey.samples.map((s) => s.id)));
    }
    setDrawCount((n) => n + 1);
  }

  const modern = register === "modern";
  const maxCount = Math.max(...survey.clusters.map((c) => c.count));

  return (
    <div
      className={
        modern
          ? "rounded-sm border border-panel-line border-l-2 border-l-modern bg-panel p-5 md:p-6"
          : "rounded-sm border border-line border-l-2 border-l-period bg-paper-deep/40 p-5 md:p-6"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p
          className={`font-mono text-xs uppercase tracking-wider ${
            modern ? "text-[#7fa3ff]" : "text-period"
          }`}
        >
          {survey.modelLabel}
        </p>
        {survey.simulated && (
          <span className="rounded-full border border-falsecont/50 bg-falsecont/10 px-2.5 py-0.5 font-mono text-[11px] text-falsecont">
            simulated — hand-written illustration
          </span>
        )}
      </div>

      {/* Distribution: one bar per cluster, direct-labeled. */}
      <div className="mt-5 space-y-3">
        {survey.clusters.map((c) => (
          <div key={c.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="flex items-baseline gap-2">
                <span
                  className={`font-mono text-[12px] ${modern ? "text-panel-ink" : "text-ink"}`}
                >
                  {c.label}
                </span>
                <CodeChip code={c.code} />
              </span>
              <span
                className={`font-mono text-[11px] tabular-nums ${modern ? "text-panel-faint" : "text-ink-faint"}`}
              >
                {c.count}/{survey.totalDraws}
              </span>
            </div>
            <div
              className={`mt-1 h-2 w-full rounded-full ${modern ? "bg-panel-soft" : "bg-line/50"}`}
            >
              <div
                className={`h-2 rounded-full ${modern ? "bg-modern" : "bg-period"} ${
                  c.label.startsWith("—") ? "opacity-45" : ""
                }`}
                style={{ width: `${(c.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Draw control */}
      <div className={`mt-6 border-t pt-4 ${modern ? "border-panel-line" : "border-line"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={draw}
            className={
              modern
                ? "cursor-pointer rounded-sm bg-modern px-3.5 py-1.5 font-mono text-xs text-white transition-opacity hover:opacity-85"
                : "cursor-pointer rounded-sm bg-period px-3.5 py-1.5 font-mono text-xs text-paper transition-opacity hover:opacity-85"
            }
          >
            {drawCount === 0 ? "Draw an answer" : "Draw again"}
          </button>
          {drawCount > 0 && currentSample && (
            <span className={`font-mono text-[11px] ${modern ? "text-panel-faint" : "text-ink-faint"}`}>
              draw {((drawCount - 1) % order.length) + 1} of {order.length} shown
              · falls in {clusterById.get(currentSample.clusterId)?.label}
            </span>
          )}
        </div>

        {currentSample && (
          <blockquote
            className={
              modern
                ? "mt-4 border-l-2 border-modern/50 pl-4 font-mono text-[0.85rem] leading-relaxed text-panel-ink"
                : "mt-4 border-l-2 border-period/50 pl-4 font-serif text-[1.02rem] leading-relaxed"
            }
          >
            {currentSample.text}
          </blockquote>
        )}

        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className={`mt-4 cursor-pointer font-mono text-[11px] underline underline-offset-4 ${
            modern ? "text-panel-faint hover:text-panel-ink" : "text-ink-faint hover:text-ink"
          }`}
        >
          {showAll ? "Hide the sample sheet" : `Read all ${survey.samples.length} written samples`}
        </button>

        {showAll && (
          <ul className={`mt-4 space-y-4 border-t pt-4 ${modern ? "border-panel-line" : "border-line"}`}>
            {survey.samples.map((s) => (
              <li key={s.id}>
                <p className={`font-mono text-[10px] uppercase tracking-wider ${modern ? "text-panel-faint" : "text-ink-faint"}`}>
                  {clusterById.get(s.clusterId)?.label}
                </p>
                <p
                  className={
                    modern
                      ? "mt-1 font-mono text-[0.82rem] leading-relaxed text-panel-ink"
                      : "mt-1 font-serif leading-relaxed"
                  }
                >
                  {s.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className={`mt-4 text-[12px] leading-snug ${modern ? "text-panel-faint" : "text-ink-faint"}`}>
        {survey.methodNote}
      </p>
    </div>
  );
}
