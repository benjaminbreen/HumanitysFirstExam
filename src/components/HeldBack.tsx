// Stances in the blind passage check are hidden until both coders finish
// (research/coding/PROTOCOL.md).
export function HeldBack({ n }: { n?: number }) {
  return (
    <p className="text-[13.5px] text-ink-faint">
      {n === undefined ? "This answer is" : n === 1 ? "1 answer is" : `${n} answers are`} hidden until the authors finish checking the quotations.
    </p>
  );
}
