import type { Metadata } from "next";
import FramedExperimentView from "@/components/FramedExperimentView";
import { companionship, data } from "@/lib/data";

export const metadata: Metadata = {
  title: `${companionship.title} · ${data.meta.title}`,
  description:
    "Affection for a speaking machine — freedom, or captivity? Real pilot draws from Talkie-1930, GPT 5.6, and Gemini 3.5 Flash, held as data.",
};

export default function CompanionshipPage() {
  return (
    <FramedExperimentView
      experiment={companionship}
      kicker="16 real model draws · five framings"
    />
  );
}
