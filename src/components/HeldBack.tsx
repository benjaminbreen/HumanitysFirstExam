// Answers for the pilot questions are hidden while their position keys are built.
export function HeldBack({ n }: { n?: number }) {
  return (
    <p className="text-[13.5px] text-ink-faint">
      {n === undefined ? "This answer is" : n === 1 ? "1 answer is" : `${n} answers are`} hidden while the authors build this question’s position key.
    </p>
  );
}
