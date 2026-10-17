"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Direction, Final, PoolPassage } from "@/lib/keys";
import { agreeFinalAction } from "../../actions";
import { Board } from "../Board";

// The final list: the same board, shared by Ben and Nathan. Any change clears
// both agreements; the list freezes when both agree to the same version.
export function FinalEditor({ q, passages, initial, labels, me, complete, max }: {
  q: string; max: number; passages: PoolPassage[]; initial: Final; labels: Record<Direction, string>; me: "ben" | "nathan"; complete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const other = me === "ben" ? "nathan" : "ben";
  const name = { ben: "Ben", nathan: "Nathan" };
  const footer = initial.frozenAt ? (
    <p className="text-[14.5px]">Frozen {new Date(initial.frozenAt).toLocaleDateString()}, agreed by Ben and Nathan.</p>
  ) : (
    <div className="space-y-2 text-[14.5px]">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1"
          checked={Boolean(initial.agreed[me])}
          disabled={busy || (!complete && !initial.agreed[me])}
          onChange={async (e) => {
            setBusy(true);
            await agreeFinalAction(q, e.target.checked);
            setBusy(false);
            router.refresh();
          }}
        />
        <span>
          I agree this is the final list.
          <span className="block text-[13px] text-ink-faint">
            {complete
              ? `${name[other]} ${initial.agreed[other] ? "has agreed" : "has not agreed yet"}. When you both agree, the list freezes. Any change clears both agreements.`
              : "Every passage must be placed and every position given a direction first."}
          </span>
        </span>
      </label>
    </div>
  );
  return (
    <Board
      q={q}
      passages={passages}
      initial={initial}
      labels={labels}
      mode="final"
      max={max}
      locked={Boolean(initial.frozenAt)}
      footer={footer}
      onSaved={() => router.refresh()}
    />
  );
}
