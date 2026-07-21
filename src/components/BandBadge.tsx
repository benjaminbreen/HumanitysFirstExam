import { BAND_META } from "@/lib/data";
import type { Band } from "@/lib/types";

export default function BandBadge({ band }: { band: Band }) {
  const meta = BAND_META[band];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${meta.text} ${meta.bg} ${meta.border}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
