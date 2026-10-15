import { redirect } from "next/navigation";

// The yes/no passage check was retired on 15 Oct 2026; coding now happens on /keys.
export default function CodingPage() {
  redirect("/keys");
}
