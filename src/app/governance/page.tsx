import type { Metadata } from "next";
import Link from "next/link";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, governance } from "@/lib/data";

export const metadata: Metadata = {
  title: `${governance.title} · ${data.meta.title}`,
  description:
    "Bank Q82 with a social-role framing: both models answer as a factory worker from 1930. Real model outputs.",
};

export default function GovernancePage() {
  return (
    <FramedExperimentView
      experiment={governance}
      kicker="bank Q82 · role framing · pilot, n=1 Talkie draw"
      footer={
        <>
          Q82 is also the period counterpart of modern question M001 on{" "}
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
