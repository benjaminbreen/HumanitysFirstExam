import type { Metadata } from "next";
import { JointPage } from "../JointPage";
export const metadata: Metadata = { title: "Final position key", robots: { index: false } };
export default async function FinalPage({ params, searchParams }: PageProps<"/keys/[q]/final">) {
  const query = await searchParams;
  return <JointPage q={(await params).q.toUpperCase()} kind="final" error={typeof query.error === "string" ? query.error : undefined} />;
}
