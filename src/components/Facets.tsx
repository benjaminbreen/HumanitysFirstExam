import Link from "next/link";

export type FacetOption = { value: string; label: string; count: number };
export type Facet = { key: string; label: string; options: FacetOption[] };

// Plain-text filter lines. Every option is a link that sets or clears one URL
// parameter, so filtered views render on the server and can be shared.
export function Facets({
  facets,
  params,
  base,
}: {
  facets: Facet[];
  params: Record<string, string | undefined>;
  base: string;
}) {
  const href = (key: string, value?: string) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== key) s.set(k, v);
    if (value) s.set(key, value);
    const q = s.toString();
    return q ? `${base}?${q}` : base;
  };
  const active = facets.some((f) => params[f.key]);
  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed">
      {facets.map((f) => (
        <div key={f.key} className="grid grid-cols-[5.5rem_1fr] items-baseline">
          <span className="label">{f.label}</span>
          <span className="flex flex-wrap gap-x-3 gap-y-0.5">
          {f.options.map((o) => {
            const on = params[f.key] === o.value;
            return (
              <Link
                key={o.value}
                href={href(f.key, on ? undefined : o.value)}
                scroll={false}
                aria-current={on ? "true" : undefined}
                className={`whitespace-nowrap ${
                  on ? "text-ink underline decoration-period decoration-2 underline-offset-4" : "text-ink-soft hover:text-ink"
                }`}
              >
                {o.label}
                <span className="num ml-1 font-mono text-[11px] text-ink-faint">{o.count}</span>
              </Link>
            );
          })}
          </span>
        </div>
      ))}
      {active && (
        <Link href={base} scroll={false} className="inline-block pt-1 font-mono text-[12px] text-modern hover:underline">
          Clear filters
        </Link>
      )}
    </div>
  );
}

export function countBy<T>(items: T[], key: (t: T) => string, order?: string[]): FacetOption[] {
  const m = new Map<string, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
  const entries = [...m.entries()];
  entries.sort((a, b) =>
    order ? order.indexOf(a[0]) - order.indexOf(b[0]) : b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  return entries.map(([value, count]) => ({ value, label: value, count }));
}
