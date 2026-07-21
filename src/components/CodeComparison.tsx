import CodeChip from "@/components/CodeChip";
import { codeCounts } from "@/lib/data";
import type { Topic } from "@/lib/types";

/**
 * Draw counts aggregated by codebook code, period vs modern, so the two
 * distributions are directly comparable. Same-scale bars, direct labels.
 */
export default function CodeComparison({ topic }: { topic: Topic }) {
  const period = codeCounts(topic.period);
  const modern = codeCounts(topic.modern);
  const codes = [...new Set([...period.keys(), ...modern.keys()])].sort(
    (a, b) =>
      (period.get(b) ?? 0) + (modern.get(b) ?? 0) -
      ((period.get(a) ?? 0) + (modern.get(a) ?? 0)),
  );
  const max = Math.max(
    ...codes.map((c) => Math.max(period.get(c) ?? 0, modern.get(c) ?? 0)),
  );

  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-paper-deep/60 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium text-period">Talkie /20</th>
            <th className="px-3 py-2 font-medium text-modern">Modern /20</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {codes.map((code) => {
            const p = period.get(code) ?? 0;
            const m = modern.get(code) ?? 0;
            return (
              <tr key={code}>
                <td className="px-3 py-2.5">
                  <CodeChip code={code} />
                </td>
                {[
                  { n: p, bar: "bg-period" },
                  { n: m, bar: "bg-modern" },
                ].map((cell, i) => (
                  <td key={i} className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-right font-mono text-xs tabular-nums">
                        {cell.n}
                      </span>
                      <div className="h-2 w-28 rounded-full bg-line/50">
                        <div
                          className={`h-2 rounded-full ${cell.bar}`}
                          style={{ width: `${(cell.n / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
