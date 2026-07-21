import type { Metadata } from "next";
import { data } from "@/lib/data";

export const metadata: Metadata = {
  title: `About · ${data.meta.title}`,
  description: `About ${data.meta.title}.`,
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        About
      </h1>
      <div className="mt-6 max-w-2xl space-y-4 font-serif text-lg leading-relaxed text-ink-soft">
        <p>
          Humanity&apos;s First Exam is a research prototype exploring how older
          ways of thinking about machines can challenge the assumptions of
          contemporary AI.
        </p>
        <p>
          It was created by{" "}
          <a
            href="https://benjaminpbreen.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            Ben Breen
          </a>{" "}
          and{" "}
          <a
            href="https://www.linkedin.com/in/nathan-cl-davies"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            Nathan Davies
          </a>{" "}
          and coded primarily by GPT-5.6 and Claude Fable.
        </p>
      </div>
    </main>
  );
}
