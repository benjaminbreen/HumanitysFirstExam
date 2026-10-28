import type { Metadata } from "next";
import { JointPage } from "../JointPage";
export const metadata: Metadata = { title: "Joint list", robots: { index: false } };
export default async function ReferencePage({ params, searchParams }: PageProps<"/keys/[q]/reference">) {
  const query = await searchParams;
  return <JointPage q={(await params).q.toUpperCase()} kind="reference" error={typeof query.error === "string" ? query.error : undefined} />;
}
