import { textLabel, type Work } from "@/lib/data";

export function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      className="size-2.5 justify-self-end self-center fill-none stroke-ink-faint stroke-[1.5] transition-transform group-open:rotate-90 group-hover:stroke-ink"
    >
      <path d="M3.5 1.5 7 5 3.5 8.5" />
    </svg>
  );
}

export const summaryClass =
  "cursor-pointer list-none py-2.5 transition-colors hover:bg-surface [&::-webkit-details-marker]:hidden";

// Small status words with their meaning in the colour; never colour alone.
export function Flag({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  const c = tone === "ok" ? "text-verified" : tone === "warn" ? "text-provisional" : "text-ink-faint";
  return <span className={`font-mono text-[11px] whitespace-nowrap ${c}`}>{children}</span>;
}

export function TextFlag({ w }: { w: Work }) {
  const tone = w.text === "full" ? "ok" : w.text === "partial" ? "warn" : "muted";
  return <Flag tone={tone}>{textLabel[w.text]}</Flag>;
}

// The passage reviewer's doubt about an argument summary.
export function ReviewCheck({ check }: { check?: string }) {
  if (!check) return null;
  const text = check.replace(/^other:\s*/, "");
  return (
    <p className="mt-1.5 text-[13px] leading-snug text-provisional">
      <span className="font-mono text-[11px]">Summary disputed by reviewer:</span> {text}
    </p>
  );
}
