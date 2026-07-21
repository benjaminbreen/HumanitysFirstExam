import type { Metadata } from "next";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, reliance } from "@/lib/data";

export const metadata: Metadata = {
  title: `${reliance.title} · ${data.meta.title}`,
  description:
    "Would habitual reliance on thinking machines strengthen or weaken thought? Real pilot draws from Talkie-1930 and ChatGPT.",
};

export default function ReliancePage() {
  return (
    <FramedExperimentView
      experiment={reliance}
      kicker="6 real model draws · four personas"
    />
  );
}
