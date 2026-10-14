"use client";

import { useEffect, useState } from "react";

export type HoverInfo = {
  code: string;
  claim: string;
  verdict: string;
  family: string;
  valence: string;
  valenceLabel: string;
  set: string;
  excerpt: string;
};

// One floating card for every [data-response] square on the page.
export function ResponseHover({ info }: { info: Record<string, HoverInfo> }) {
  const [state, setState] = useState<{ id: string; x: number; y: number; below: boolean } | null>(null);

  useEffect(() => {
    function show(e: Event) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-response]");
      if (!el) return;
      const id = el.dataset.response!;
      if (!info[id]) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(Math.max(r.left + r.width / 2, 170), window.innerWidth - 170);
      const below = r.top < 230;
      setState({ id, x, y: below ? r.bottom + 10 : r.top - 10, below });
    }
    function hide(e: Event) {
      const el = (e.target as HTMLElement).closest("[data-response]");
      if (el) setState(null);
    }
    const clear = () => setState(null);
    document.addEventListener("pointerover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("pointerout", hide);
    document.addEventListener("focusout", hide);
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      document.removeEventListener("pointerover", show);
      document.removeEventListener("focusin", show);
      document.removeEventListener("pointerout", hide);
      document.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", clear);
    };
  }, [info]);

  if (!state) return null;
  const d = info[state.id];
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 w-[320px] rounded-md border border-line bg-bg p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      style={{
        left: state.x - 160,
        top: state.y,
        transform: state.below ? undefined : "translateY(-100%)",
      }}
    >
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <span className="inline-block size-[10px] rounded-[1.5px]" style={{ background: `var(--${d.family})` }} />
        {d.claim}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11px] text-ink-soft">
        <span>{d.code}</span>
        <span>{d.verdict}</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-[8px] rounded-full" style={{ background: `var(--${d.valence})` }} />
          {d.valenceLabel}
        </span>
      </div>
      <p className="mt-2.5 font-mono text-[12px] leading-[1.55] text-ink">{d.excerpt}</p>
      <div className="mt-2.5 flex justify-between font-mono text-[10.5px] text-ink-faint">
        <span>{d.set}</span>
        <span>Click to open →</span>
      </div>
    </div>
  );
}
