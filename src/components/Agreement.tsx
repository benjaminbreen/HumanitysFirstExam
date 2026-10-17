import { kappa, type Tally } from "@/lib/keys";

// Agreement between each pair of sorters: Ben–Nathan is the reference.
export function AgreementTable({ rows }: { rows: { pair: string; t: Tally }[] }) {
  const pct = (a: number, b: number) => (b ? ` (${Math.round((100 * a) / b)}%)` : "");
  return (
    <table className="w-full max-w-3xl border-t border-rule text-left text-[15px]">
      <thead>
        <tr className="label border-b border-line">
          <th className="py-2 pr-4 font-normal">Pair</th>
          <th className="py-2 pr-4 font-normal">Grouped together</th>
          <th className="py-2 pr-4 font-normal">Same direction</th>
          <th className="py-2 pr-4 font-normal">Kappa</th>
          <th className="py-2 font-normal">Left out</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ pair, t }) => {
          const k = kappa(t.dirs);
          return (
            <tr key={pair} className="num border-b border-line align-baseline font-mono text-[13.5px]">
              <td className="py-2 pr-4 font-sans text-[15px]">{pair}</td>
              <td className="py-2 pr-4">{t.together} of {t.either} pairs{pct(t.together, t.either)}</td>
              <td className="py-2 pr-4">{t.same} of {t.n}{pct(t.same, t.n)}</td>
              <td className="py-2 pr-4">{k == null ? "–" : k.toFixed(2)}</td>
              <td className="py-2">{t.left}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function AgreementKey() {
  return (
    <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">
      Grouped together: of the pairs of passages that either sorter put in the same position, how many both did.
      Same direction: passages given the same Yes, No or Other by both (Off the question counts as its own answer).
      Kappa corrects that figure for agreement expected by chance. Left out: passages either sorter marked Unclear.
      The test: Claude agrees with each historian about as often as the historians agree with each other.
    </p>
  );
}
