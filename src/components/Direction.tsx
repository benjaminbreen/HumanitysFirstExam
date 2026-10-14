import { directionLabel, type Direction as D } from "@/lib/data";

// Shape carries the category; the label always accompanies it.
const shapes: Record<D, React.ReactNode> = {
  machine: <path d="M5 1 9 9H1Z" />,
  human: <circle cx="5" cy="5" r="4" />,
  both: <path d="M5 1 9 5 5 9 1 5Z" />,
};

export function DirectionMark({ direction }: { direction: D }) {
  return (
    <svg viewBox="0 0 10 10" className="inline size-2.5 shrink-0 fill-current" aria-hidden>
      {shapes[direction]}
    </svg>
  );
}

export function Direction({ direction }: { direction: D }) {
  return (
    <span className="inline-flex items-center gap-2">
      <DirectionMark direction={direction} />
      {directionLabel[direction]}
    </span>
  );
}
