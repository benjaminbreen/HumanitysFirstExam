import type { Metadata } from "next";
import Link from "next/link";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, persona } from "@/lib/data";

export const metadata: Metadata = {
  title: `${persona.title} · ${data.meta.title}`,
  description:
    "The first modern-native question put to Talkie-1930: an AI persona's autonomy against its user's welfare. Real model outputs.",
};

export default function PersonaPage() {
  return (
    <FramedExperimentView
      experiment={persona}
      kicker="13 real model draws · modern bank M009 · two framings"
      footer={
        <>
          This is the reverse direction of the exam: a question from the
          modern bank, translated into period vocabulary for Talkie. Its
          judged pairing (with period Q81) is on{" "}
          <Link
            href="/relationships"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            the relationship map →
          </Link>
        </>
      }
    />
  );
}
