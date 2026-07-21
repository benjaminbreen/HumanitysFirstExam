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
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-3 px-5 py-4">
            <Link href="/">
              <span className="font-display text-xl font-semibold tracking-tight">
                {data.meta.title}
              </span>
              <span className="ml-3 font-mono text-xs text-ink-faint">
                1850–1940 ⇄ now
              </span>
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs sm:gap-x-6 sm:text-sm">
              <Link href="/demo" className="text-ink-soft hover:text-ink">
                Demo
              </Link>
              <Link href="/questions" className="text-ink-soft hover:text-ink">
                Questions
              </Link>
              <Link href="/sources" className="text-ink-soft hover:text-ink">
                Sources
              </Link>
              <Link href="/method" className="text-ink-soft hover:text-ink">
                Method
              </Link>
              {process.env.NODE_ENV === "development" && (
                <Link href="/admin" className="text-period hover:text-ink">
                  Review
                </Link>
              )}
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-12 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-5 px-5 py-7 text-sm text-ink-soft sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="font-display text-base font-semibold text-ink">
                {data.meta.title}
              </p>
              <p className="mt-1">
                A prototype by{" "}
                <a
                  href="https://benjaminpbreen.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                >
                  Ben Breen
                </a>{" "}
                and{" "}
                <a
                  href="https://www.linkedin.com/in/nathan-cl-davies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
                >
                  Nathan Davies
                </a>
                .
              </p>
            </div>
            <div className="sm:text-right">
              <nav className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
                <Link href="/codebook" className="hover:text-ink">
                  Schema
                </Link>
                <Link href="/method" className="hover:text-ink">
                  Method
                </Link>
                <Link href="/about" className="hover:text-ink">
                  About
                </Link>
              </nav>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                {data.meta.version} · {data.meta.generated}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
