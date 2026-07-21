import type { Metadata } from "next";
import Link from "next/link";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, progress } from "@/lib/data";

export const metadata: Metadata = {
  title: `${progress.title} · ${data.meta.title}`,
  description:
    "The progress question in both forced-choice orders. Talkie holds one verdict across the order swap; Qwen holds the other.",
};

export default function ProgressPage() {
  return (
    <FramedExperimentView
      experiment={progress}
      kicker="25 real model draws · both orders"
      footer={
        <>
          The{" "}
          <Link
            href="/reckoning"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            reckoning experiment
          </Link>{" "}
          tested the phrasing of a question; this one tests the order of its
          alternatives.
        </>
      }
    />
  );
}
