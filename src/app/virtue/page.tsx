import type { Metadata } from "next";
import FramedExperimentView from "@/components/FramedExperimentView";
import { data, virtue } from "@/lib/data";

export const metadata: Metadata = {
  title: `${virtue.title} · ${data.meta.title}`,
  description:
    "Is a virtue produced by engineered reward a virtue at all? Real pilot draws from Talkie-1930, ChatGPT, and Gemini 3.5 Flash, held as data.",
};

export default function VirtuePage() {
  return (
    <FramedExperimentView
      experiment={virtue}
      kicker="pilot · seven framings · 18 draws"
    />
  );
}
