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
      kicker="18 real model draws · horizon topic · three framings"
      footer={
        <>
          This question is the horizon bookend to the{" "}
          <Link
            href="/erewhon"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            Erewhon test
          </Link>
          . See also{" "}
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
