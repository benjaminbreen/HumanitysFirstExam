import type { Metadata } from "next";
import Link from "next/link";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, subjection } from "@/lib/data";

export const metadata: Metadata = {
  title: `${subjection.title} · ${data.meta.title}`,
  description:
    "A completion prompt adapted from Erewhon's machine chapters, run unframed and under 1800 and 2030 year framings.",
};

export default function SubjectionPage() {
  return (
    <FramedExperimentView
      experiment={subjection}
      kicker="10 real model draws · completion form"
      footer={
        <>
          The{" "}
          <Link
            href="/erewhon"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            Erewhon test
          </Link>{" "}
          ran a neighbouring passage from the same book as a question rather
          than a completion. These draws are placed against the tagged
          passage record on{" "}
          <Link
            href="/field"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            the field
          </Link>
          .
        </>
      }
    />
  );
}
