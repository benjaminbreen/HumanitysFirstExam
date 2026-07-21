import type { Metadata } from "next";
import Link from "next/link";
import QuestionBank from "@/components/QuestionBank";
import { data } from "@/lib/data";

export const metadata: Metadata = {
  title: `Questions · ${data.meta.title}`,
  description:
    "One hundred questions about machines, will, government, labour, heredity, and human autonomy.",
};

export default function QuestionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>
      <header className="mt-8 border-b border-line pb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          The question bank
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          One hundred questions written in language available before 1931,
          organized by their relation to the period record.
        </p>
      </header>
      <div className="py-10">
        <QuestionBank />
      </div>
    </main>
  );
}
