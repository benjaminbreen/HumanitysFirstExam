"use client";

// Wraps a heading's text. Clicking swaps every pixel-face element on the site
// between Silkscreen and blackletter; the choice is remembered per browser.
export function FaceToggle({ children }: { children: React.ReactNode }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.face === "fraktur" ? "pixel" : "fraktur";
    if (next === "fraktur") root.dataset.face = next;
    else delete root.dataset.face;
    try {
      localStorage.setItem("face", next);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      title="Switch typeface"
      className="cursor-pointer text-left [font:inherit]"
    >
      {children}
    </button>
  );
}
