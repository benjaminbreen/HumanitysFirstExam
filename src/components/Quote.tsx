import { Flag } from "@/components/Row";
import type { Passage } from "@/lib/data";

const codes: Record<string, string> = { Russian: "ru", German: "de", French: "fr", Latin: "la", Italian: "it", Spanish: "es", Czech: "cs", Greek: "grc", Chinese: "zh", Japanese: "ja" };

// A stance's quotation. Non-English quotations show the original beside a
// machine translation. OCR-corrected quotations show the corrected text.
export function Quote({ p }: { p: Passage }) {
  return (
    <div className="mt-2">
      <div className={`grid gap-x-8 gap-y-3 ${p.translation ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
        <blockquote
          lang={codes[p.language] ?? "en"}
          className={`border-l-2 border-period pl-4 font-serif text-[1.04rem] leading-[1.6] ${p.translation ? "text-ink-soft" : ""}`}
        >
          {p.corrected ?? p.original}
        </blockquote>
        {p.translation && (
          <p className="order-first border-l-2 border-line pl-4 font-serif text-[1.04rem] leading-[1.6] lg:order-none">
            {p.translation}
          </p>
        )}
      </div>
      {(p.translation || p.correction) && (
        <p className="mt-1.5 flex gap-x-4 pl-4">
          {p.correction && <Flag tone="warn">{p.correction.startsWith("hand") ? "OCR corrected by hand" : "OCR corrected"}</Flag>}
          {p.translation && <Flag tone="warn">machine translation</Flag>}
        </p>
      )}
    </div>
  );
}
