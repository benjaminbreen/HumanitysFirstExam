import Link from "next/link";
import { formatYear, type Work } from "@/lib/data";

// Year, author, title: the one way a work is named everywhere on the site.
export function Cite({ w, link = true }: { w: Work; link?: boolean }) {
  const title = <span className="font-serif text-[1.06em] italic">{w.title}</span>;
  return (
    <span>
      <span className="num mr-2 font-mono text-[12px] text-ink-faint">{formatYear(w.year)}</span>
      {w.authorShort},{" "}
      {link ? (
        <Link href={`/sources/${w.id}`} className="decoration-line underline-offset-4 hover:underline hover:decoration-ink-soft">
          {title}
        </Link>
      ) : (
        title
      )}
    </span>
  );
}
