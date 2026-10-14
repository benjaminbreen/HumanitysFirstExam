import Link from "next/link";
import { family, meterOrder, type Response } from "@/lib/trials";

// One square per response. `code`: squares for responses making that claim
// are filled. `full`: every square in its colour (navigation grids).
export function Meter({
  rs,
  code,
  base,
  full = false,
  current,
  size = 20,
}: {
  rs: Response[];
  code?: string;
  base: string;
  full?: boolean;
  current?: string;
  size?: number;
}) {
  const ordered = code ? meterOrder(rs, code) : rs;
  const empty = Math.max(0, size - ordered.length);
  return (
    <div
      className="grid max-w-[360px] gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${Math.max(size, ordered.length)}, minmax(0, 1fr))` }}
    >
      {ordered.map((r) => (
        <Link
          key={r.id}
          href={`${base}/${r.id}`}
          data-response={r.id}
          data-hit={code && r.code === code ? "" : undefined}
          data-full={full ? "" : undefined}
          data-current={current === r.id ? "" : undefined}
          aria-label={`Response ${r.id}: ${r.code}, ${r.valence}`}
          className={`sq v-${family(r)}`}
        />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} className="sq opacity-40" aria-hidden />
      ))}
    </div>
  );
}

export function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-[11px] shrink-0 rounded-[1.5px]"
      style={{ background: `var(--${color})` }}
    />
  );
}
