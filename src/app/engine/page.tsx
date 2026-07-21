import type { Metadata } from "next";
import Link from "next/link";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, engine } from "@/lib/data";

export const metadata: Metadata = {
  title: `${engine.title} · ${data.meta.title}`,
  description:
    "The horizon-topic opening put to Talkie-1930 and nine isolated frontier-model instances under three temporal framings. Real model outputs.",
};

export default function EnginePage() {
  return (
    <FramedExperimentView
      experiment={engine}
      kicker="horizon topic · three framings · pilot, n=3 per cell"
      footer={
        <>
          This question is the horizon bookend to the{" "}
          <Link
            href="/erewhon"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            Erewhon test
          </Link>{" "}
          — the 2030 flip replicates. Its worked topic page, with simulated
          20-draw distributions and primary sources:{" "}
          <Link
            href={`/topics/${engine.topicSlug}`}
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            The engine that foresees →
          </Link>
        </>
      }
    />
  );
}
