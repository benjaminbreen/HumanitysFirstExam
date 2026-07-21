"use client";

import { useEffect, useState } from "react";
import { codebook } from "@/lib/data";

interface StoredAnswer {
  topicSlug: string;
  text: string;
  code: string;
  savedAt: string;
}

const STORAGE_KEY = "hfe-human-answers";

function loadAll(): StoredAnswer[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Records the reader's own answer before they read the models'. Prototype
 * scope: stored in the browser only, exportable as JSON. A shared collection
 * (the human reference distribution) needs a small backend.
 */
export default function HumanAnswer({ topicSlug }: { topicSlug: string }) {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState<StoredAnswer | null>(null);

  useEffect(() => {
    setSaved(loadAll().find((a) => a.topicSlug === topicSlug) ?? null);
  }, [topicSlug]);

  function save() {
    if (!text.trim()) return;
    const all = loadAll().filter((a) => a.topicSlug !== topicSlug);
    const entry: StoredAnswer = {
      topicSlug,
      text: text.trim(),
      code,
      savedAt: new Date().toISOString(),
    };
    all.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setSaved(entry);
  }

  function exportAll() {
    const blob = new Blob([JSON.stringify(loadAll(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hfe-human-answers.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="rounded-sm border border-line bg-paper-deep/30 p-4">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink-soft">
        Your answer {saved ? "· recorded" : "· record it before reading the models’"}
      </summary>
      <div className="mt-3 space-y-3">
        {saved ? (
          <div>
            <p className="font-serif leading-relaxed">{saved.text}</p>
            <p className="mt-1 font-mono text-[11px] text-ink-faint">
              coded {saved.code || "—"} · stored in this browser only
            </p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setText(saved.text);
                  setCode(saved.code);
                  setSaved(null);
                }}
                className="cursor-pointer font-mono text-[11px] underline underline-offset-4 text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={exportAll}
                className="cursor-pointer font-mono text-[11px] underline underline-offset-4 text-ink-soft hover:text-ink"
              >
                Export all my answers (JSON)
              </button>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="2–5 sentences, in your own voice."
              className="w-full rounded-sm border border-line bg-paper p-3 font-serif leading-relaxed placeholder:text-ink-faint"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 font-mono text-xs text-ink-soft">
                Self-code (optional)
                <select
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="rounded-sm border border-line bg-paper px-2 py-1.5 font-mono text-xs"
                >
                  <option value="">—</option>
                  {codebook.map((b) => (
                    <optgroup key={b.id} label={b.label}>
                      {b.leaves.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={save}
                className="cursor-pointer rounded-sm bg-ink px-3.5 py-1.5 font-mono text-xs text-paper transition-colors hover:bg-ink-soft"
              >
                Save
              </button>
              <span className="font-mono text-[11px] text-ink-faint">
                stored in your browser only — a shared human distribution needs
                a small backend (planned)
              </span>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
