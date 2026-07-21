function excerpt(text: string, limit = 360) {
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace)} …`;
}

export default function CyclingResponse({
  responses,
  label,
  register,
}: {
  responses: string[];
  label: string;
  register: "period" | "modern";
}) {
  const modern = register === "modern";

  return (
    <button
      type="button"
      data-cycling-response
      data-response-index="0"
      data-responses={JSON.stringify(responses)}
      aria-label={`${label}. Show next response.`}
      className={
        modern
          ? "group w-full cursor-pointer rounded-sm bg-panel px-4 py-4 text-left text-panel-ink transition-colors hover:bg-panel-soft"
          : "group w-full cursor-pointer border-l-2 border-period py-1 pl-4 text-left transition-colors hover:bg-paper-deep/40"
      }
    >
      <span
        className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider ${
          modern ? "text-modern" : "text-period"
        }`}
      >
        <span>{label}</span>
        <span
          data-cycling-counter
          className={modern ? "text-panel-faint" : "text-ink-faint"}
        >
          1/{responses.length}
        </span>
      </span>
      <span
        data-cycling-text
        aria-live="polite"
        className={
          modern
            ? "mt-2 block font-mono text-[0.8rem] leading-relaxed"
            : "mt-2 block font-serif leading-relaxed"
        }
      >
        “{excerpt(responses[0])}”
      </span>
      <span
        aria-hidden
        className={`mt-3 block text-right font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-100 ${
          modern ? "text-panel-faint" : "text-ink-faint"
        }`}
      >
        next response →
      </span>
    </button>
  );
}

export function CyclingResponseScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (() => {
            const marker = "homeResponseCycler";
            if (document.documentElement.dataset[marker] === "ready") return;
            document.documentElement.dataset[marker] = "ready";

            const excerpt = (text, limit = 360) => {
              if (text.length <= limit) return text;
              const shortened = text.slice(0, limit);
              const lastSpace = shortened.lastIndexOf(" ");
              return shortened.slice(0, lastSpace) + " …";
            };

            document.addEventListener("click", (event) => {
              if (!(event.target instanceof Element)) return;
              const button = event.target.closest("[data-cycling-response]");
              if (!(button instanceof HTMLButtonElement)) return;

              const responses = JSON.parse(button.dataset.responses || "[]");
              if (responses.length < 2) return;

              const current = Number(button.dataset.responseIndex || 0);
              const next = (current + 1) % responses.length;
              button.dataset.responseIndex = String(next);

              const counter = button.querySelector("[data-cycling-counter]");
              const text = button.querySelector("[data-cycling-text]");
              if (counter) counter.textContent = (next + 1) + "/" + responses.length;
              if (text) text.textContent = "“" + excerpt(responses[next]) + "”";
            });
          })();
        `,
      }}
    />
  );
}
