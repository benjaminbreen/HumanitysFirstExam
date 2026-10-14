import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Coding protocol", robots: { index: false } };

export default async function ProtocolPage() {
  const text = await readFile(path.join(process.cwd(), "research", "coding", "PROTOCOL.md"), "utf8");
  const [title, ...rest] = text.split("\n\n");
  return (
    <article className="max-w-2xl">
      <Link href="/coding" className="text-[15px] text-ink-soft hover:text-ink">← Coding</Link>
      <h1 className="mt-5 mb-8 font-pixel text-[32px] leading-none">{title}</h1>
      <div className="space-y-4 text-[15.5px] leading-relaxed">
        {rest.map((block, i) =>
          block.includes("\n") || block.length > 40 ? (
            <p key={i} className="whitespace-pre-line">{block}</p>
          ) : (
            <h2 key={i} className="pt-4 text-[1.1rem] font-semibold">{block}</h2>
          ),
        )}
      </div>
    </article>
  );
}
