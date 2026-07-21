import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Newsreader } from "next/font/google";
import Link from "next/link";
import { data } from "@/lib/data";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: data.meta.title,
  description:
    "Questions about machines and human autonomy, put to a pre-1931 language model, frontier models, and human respondents, scored against positions attested in the period record.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 py-5">
            <Link href="/">
              <span className="font-display text-xl font-semibold tracking-tight">
                {data.meta.title}
              </span>
              <span className="ml-3 font-mono text-xs text-ink-faint">
                1859–1940 ⇄ now
              </span>
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
              <Link href="/demo" className="text-ink-soft hover:text-ink">
                Demo
              </Link>
              <Link href="/#results" className="text-ink-soft hover:text-ink">
                Results
              </Link>
              <Link href="/#questions" className="text-ink-soft hover:text-ink">
                Questions
              </Link>
              <Link href="/examinees" className="text-ink-soft hover:text-ink">
                Examinees
              </Link>
              <Link href="/sources" className="text-ink-soft hover:text-ink">
                Sources
              </Link>
              <Link href="/#method" className="text-ink-soft hover:text-ink">
                Method
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl space-y-3 px-5 py-8 text-sm text-ink-soft">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">
              Mockup · {data.meta.version} · generated {data.meta.generated}
            </p>
            <p className="max-w-3xl">{data.meta.note}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
