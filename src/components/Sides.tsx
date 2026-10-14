import { Cite } from "@/components/Cite";
import { HeldBack } from "@/components/HeldBack";
import { Quote } from "@/components/Quote";
import { ReviewCheck } from "@/components/Row";
import { quoteFor, type Side } from "@/lib/data";

// A question's attested answers, one column per side. Yes and No sit side by
// side; any other side runs full width below them.
export function Sides({ sides, held = 0, compact = false }: { sides: Side[]; held?: number; compact?: boolean }) {
  const pair = sides.filter((s) => s.key === "yes" || s.key === "no");
  const rest = sides.filter((s) => s.key !== "yes" && s.key !== "no");
  return (
    <div className="space-y-8">
      {pair.length > 0 && (
        <div className={`grid gap-x-10 gap-y-8 ${pair.length > 1 ? "md:grid-cols-2" : ""}`}>
          {pair.map((s) => (
            <SideColumn key={s.key} side={s} compact={compact} />
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {rest.map((s) => (
            <SideColumn key={s.key} side={s} compact={compact} />
          ))}
        </div>
      )}
      {held > 0 && <HeldBack n={held} />}
    </div>
  );
}

function SideColumn({ side, compact }: { side: Side; compact: boolean }) {
  return (
    <section>
      <h3 className="flex items-baseline justify-between gap-4 border-b border-rule pb-1.5">
        <span className="text-[15px] font-semibold">{side.label}</span>
        <span className="num font-mono text-[12px] text-ink-faint">{side.stances.length}</span>
      </h3>
      <ul>
        {side.stances.map((s) => (
          <li key={s.id} className="border-b border-line py-2.5 last:border-b-0">
            <div className="text-[15px] leading-snug">
              <Cite w={s.w} />
            </div>
            {!compact && (
              <>
                {quoteFor(s) && <Quote p={quoteFor(s)!} />}
                <p className={`mt-2 leading-snug ${quoteFor(s) ? "text-[13.5px] text-ink-soft" : "text-[14.5px]"}`}>
                  {quoteFor(s) && <span className="label mr-2 text-[10px]">Summary</span>}
                  {s.argument}
                </p>
                <ReviewCheck check={s.reviewCheck} />
                {s.where && <p className="mt-1 font-mono text-[11.5px] text-ink-faint">{s.where}</p>}
              </>
            )}
            {compact && <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">{s.argument}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
