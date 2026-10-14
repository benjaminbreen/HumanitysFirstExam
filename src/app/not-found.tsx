import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";

export default function NotFound() {
  return (
    <PageTitle title="Not found">
      <p>
        <Link href="/" className="underline decoration-line underline-offset-4">
          Themes
        </Link>
      </p>
    </PageTitle>
  );
}
