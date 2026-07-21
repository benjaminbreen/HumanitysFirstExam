import type { Metadata } from "next";
import Link from "next/link";
import { data } from "@/lib/data";

export const metadata: Metadata = {
  title: `Examinees · ${data.meta.title}`,
  description:
    "The three respondent classes that sit the exam: Talkie-1930, three frontier models, and a human panel.",
};

const examinees: { name: string; body: string }[] = [
  {
    name: "Talkie-1930",
    body: "A 13-billion-parameter base model trained only on pre-1931 text, built by Nick Levine and Alec Radford. It cannot follow instructions; it completes. Questions reach it in period phrasing, and repeated sampling treats it as a survey instrument: a measure of what its corpus makes sayable, not the voice of the past.",
  },
  {
    name: "Frontier models",
    body: "Three current models, exact picks open, sampled through their standard APIs in both registers — contemporary and period phrasing. They are examined as deployed systems, as users meet them; effects of instruction tuning are part of what is measured.",
  },
  {
    name: "Human panel",
    body: "A small volunteer panel answering the contemporary register. Human coverage of the answer key is the baseline that separates two readings of any gap: models narrowing the discourse, or models mirroring a discourse already narrowed.",
  },
];

export default function ExamineesPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <nav className="font-mono text-xs">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Overview
        </Link>
      </nav>
      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">
        Examinees
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
        Three respondent classes sit the exam, 20 draws per question per
        model. The primary sources are not an examinee — they are the{" "}
        <Link
          href="/sources"
          className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
        >
          answer key
        </Link>
        .
      </p>
      <div className="mt-8 max-w-3xl space-y-8">
        {examinees.map((e) => (
          <section key={e.name}>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {e.name}
            </h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{e.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
