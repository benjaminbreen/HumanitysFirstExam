"use client";

import { useEffect, useRef, useState } from "react";

const TEXT = "Humanity’s First Exam";
const GLYPHS = "#%&*+=<>?/!$@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FRAME_MS = 45;
const DECAY_FRAMES = 7; // letters break up
const RESOLVE_FRAMES = 14; // then settle back, left to right

const random = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

// On hover or focus the letters break into random glyphs, then reassemble.
// At rest this is plain text. While scrambled, the width is pinned to the
// rest width so the nav doesn't move. Skipped under prefers-reduced-motion.
export function Wordmark() {
  const [text, setText] = useState(TEXT);
  const [width, setWidth] = useState<number>();
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  function run() {
    if (timer.current || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setWidth(ref.current.getBoundingClientRect().width);
    const letters = [...TEXT];
    let frame = 0;
    timer.current = setInterval(() => {
      frame++;
      if (frame >= DECAY_FRAMES + RESOLVE_FRAMES) {
        clearInterval(timer.current!);
        timer.current = null;
        setText(TEXT);
        setWidth(undefined);
        return;
      }
      const settled = ((frame - DECAY_FRAMES) / RESOLVE_FRAMES) * letters.length;
      setText(
        letters
          .map((c, i) => {
            if (c === " ") return c;
            if (frame <= DECAY_FRAMES) {
              return Math.random() < frame / DECAY_FRAMES ? random() : c;
            }
            return i < settled ? c : random();
          })
          .join(""),
      );
    }, FRAME_MS);
  }

  return (
    <span
      ref={ref}
      onMouseEnter={run}
      onFocus={run}
      aria-label={TEXT}
      role="img"
      className="inline-block whitespace-nowrap"
      style={width ? { width } : undefined}
    >
      <span aria-hidden>{text}</span>
    </span>
  );
}
