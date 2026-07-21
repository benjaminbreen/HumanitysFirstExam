"use client";

import { useEffect, useState } from "react";

export default function SourceTextReader({
  path,
  title,
  language,
}: {
  path: string;
  title: string;
  language: string;
}) {
  const [result, setResult] = useState({ path: "", text: "", error: false });

  useEffect(() => {
    const controller = new AbortController();

    fetch(path, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Source text unavailable");
        return response.text();
      })
      .then((text) => setResult({ path, text, error: false }))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setResult({ path, text: "", error: true });
      });

    return () => controller.abort();
  }, [path]);

  if (result.path === path && result.error) {
    return (
      <p className="border-l-2 border-period pl-4 text-sm text-ink-soft">
        The reading text could not be loaded. The source edition remains
        available from the link above.
      </p>
    );
  }

  if (result.path !== path || !result.text) {
    return (
      <p className="font-mono text-xs text-ink-faint" role="status">
        Loading text…
      </p>
    );
  }

  return (
    <article
      className="whitespace-pre-wrap font-serif text-[1.03rem] leading-[1.78]"
      aria-label={title}
      lang={language === "English" ? "en" : undefined}
    >
      {result.text}
    </article>
  );
}
