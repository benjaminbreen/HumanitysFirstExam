import { redirect } from "next/navigation";

// The one-to-one comparison with Claude was replaced by the agreement page.
export default async function ComparePage({ params }: PageProps<"/keys/[q]/compare">) {
  redirect(`/keys/${(await params).q.toLowerCase()}/agreement`);
}
