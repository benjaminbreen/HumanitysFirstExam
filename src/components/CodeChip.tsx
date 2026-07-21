import Link from "next/link";
import { getCode } from "@/lib/data";

/** A codebook code as a small chip linking to its definition. */
export default function CodeChip({ code }: { code: string }) {
  const leaf = getCode(code);
  if (!leaf) return null;
  return (
    <Link
      href={`/codebook#${leaf.branchId}`}
      title={leaf.definition}
      className="inline-flex items-center rounded-sm border border-ink-faint/40 bg-paper-deep/60 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft hover:border-ink-soft"
    >
      {leaf.label}
    </Link>
  );
}
