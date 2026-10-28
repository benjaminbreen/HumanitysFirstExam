import { kappa, type Tally } from "@/lib/keys";

export function AgreementTable({ rows }: { rows: { pair: string; t: Tally }[] }) {
  const pct = (a: number, b: number) => b ? `${Math.round(100 * a / b)}%` : "Undefined";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-t border-rule text-left text-[14px]">
        <thead><tr className="label border-b border-line">
          {["Pair", "Grouped together", "Same direction", "Kappa", "Unclear left out", "Off, first / second", "Grouping passages", "Off left out of grouping"].map((h) => <th key={h} className="py-2 pr-4 font-normal">{h}</th>)}
        </tr></thead>
        <tbody>{rows.map(({ pair, t }) => {
          const k = kappa(t.dirs);
          return <tr key={pair} className="num border-b border-line align-baseline font-mono text-[12px]">
            <td className="py-2 pr-4 font-sans text-[14px]">{pair}</td>
            <td className="py-2 pr-4">{t.together} / {t.either} ({pct(t.together, t.either)})</td>
            <td className="py-2 pr-4">{t.same} / {t.n} ({pct(t.same, t.n)})</td>
            <td className="py-2 pr-4">{k == null ? "–" : k.toFixed(2)}</td>
            <td className="py-2 pr-4">{t.left}</td>
            <td className="py-2 pr-4">{t.offA} / {t.offB}</td>
            <td className="py-2 pr-4">{t.groupingN}</td>
            <td className="py-2">{t.groupingOff}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}
export function AgreementKey() {
  return <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">
    Grouping: passage pairs put together by both sorters, divided by pairs put together by either. Off passages
    are excluded from grouping. Direction: the same Yes, No, Other or Off label. Unclear passages are excluded
    from that comparison. Kappa adjusts direction agreement for chance. Coverage can differ between pairs.
    These scores do not judge the written arguments. One question’s score is not a finding.
  </p>;
}
