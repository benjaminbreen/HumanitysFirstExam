import { instructions } from "@/lib/key-model";

// This exact text is also supplied by scripts/prepare-key-sorting.mjs.
export function KeyInstructions() {
  return <div className="space-y-2 text-[15px] leading-relaxed text-ink-soft">
    {instructions.text.split("\n\n").map((p) => <p key={p}>{p.replaceAll("\n", " ")}</p>)}
  </div>;
}
