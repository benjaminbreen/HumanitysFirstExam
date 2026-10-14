"use client";

// Switches between light and dark. Until clicked, the site follows the
// system setting; the choice is then remembered per browser. The saved
// choice is applied before paint by the script in app/layout.tsx.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      title="Switch light and dark"
      aria-label="Switch light and dark"
      className="py-4 text-[17px] leading-none text-ink-soft hover:text-ink"
    >
      ◐
    </button>
  );
}
