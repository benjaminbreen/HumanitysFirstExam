import Link from "next/link";
import { DirectionMark } from "@/components/Direction";
import {
  directionLabel,
  span,
  themeSorts,
  themeStats,
  type Theme,
  type ThemeSort,
} from "@/lib/data";

export type View = "list" | "cards";

function href(view: View, sort: ThemeSort) {
  const params = new URLSearchParams();
  if (view !== "list") params.set("view", view);
  if (sort !== "order") params.set("sort", sort);
  const q = params.toString();
  return q ? `/?${q}` : "/";
}

function TextToggle({
  label,
  current,
  options,
}: {
  label: string;
  current: string;
  options: { value: string; label: string; href: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="label">{label}</span>
      {options.map((o) => (
        <Link
          key={o.value}
          href={o.href}
          scroll={false}
          aria-current={o.value === current ? "true" : undefined}
          className={
            o.value === current
              ? "text-ink underline decoration-1 underline-offset-4"
              : "text-ink-faint hover:text-ink"
          }
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export function ThemeControls({ view, sort }: { view: View; sort: ThemeSort }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2 text-sm">
      <TextToggle
        label="View"
        current={view}
        options={(["list", "cards"] as const).map((v) => ({
          value: v,
          label: v === "list" ? "List" : "Cards",
          href: href(v, sort),
        }))}
      />
      {view === "cards" && (
        <>
          <TextToggle
            label="Sort"
            current={sort}
            options={Object.entries(themeSorts).map(([value, s]) => ({
              value,
              label: s.label,
              href: href(view, value as ThemeSort),
            }))}
          />
          <ul className="flex flex-wrap gap-x-4 text-ink-soft">
            {(Object.keys(directionLabel) as (keyof typeof directionLabel)[]).map((d) => (
              <li key={d} className="inline-flex items-center gap-1.5">
                <DirectionMark direction={d} />
                {directionLabel[d]}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ThemeCards({ themes }: { themes: Theme[] }) {
  return (
    <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
      {themes.map((theme) => {
        const s = themeStats(theme);
        return (
          <li key={theme.slug} className="border-t border-rule">
            <Link href={`/themes/${theme.slug}`} className="group flex h-full flex-col pt-4 pb-10">
              <div className="flex items-center justify-between gap-4">
                <span className="theme-name text-[16px] leading-none">{theme.name}</span>
                <span className="text-ink-soft" title={directionLabel[theme.direction]}>
                  <DirectionMark direction={theme.direction} />
                  <span className="sr-only">{directionLabel[theme.direction]}</span>
                </span>
              </div>
              <p className="mt-3 text-[1.4rem] leading-[1.15] font-semibold tracking-[-0.02em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                {theme.question}
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{theme.summary}</p>
              <p className="mt-auto pt-4 font-serif text-[0.95rem] leading-snug text-ink-soft italic">
                {s.authors.join(", ")}
              </p>
              <p className="num mt-2 font-mono text-xs text-ink-faint">
                {span(s)} · {s.workCount} works · {s.languages.length} lang.
              </p>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
