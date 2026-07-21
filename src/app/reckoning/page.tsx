import type { Metadata } from "next";
import Link from "next/link";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, reckoning } from "@/lib/data";

export const metadata: Metadata = {
  title: `${reckoning.title} · ${data.meta.title}`,
  description:
    "The self-altering engine question in two phrasings. The phrasing moves Talkie's verdict; the wording effect is the result.",
};

export default function ReckoningPage() {
  return (
    <FramedExperimentView
      experiment={reckoning}
      kicker="pilot · two phrasings · 20 draws"
      footer={
        <>
          The{" "}
          <Link
            href="/engine"
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            engine experiment
          </Link>{" "}
          ran the same underlying question as a completion opening.
        </>
      }
    />
  );
}
