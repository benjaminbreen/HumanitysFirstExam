import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Instrument_Sans,
  Newsreader,
  Silkscreen,
  UnifrakturMaguntia,
} from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

const fraktur = UnifrakturMaguntia({
  variable: "--font-fraktur",
  subsets: ["latin"],
  weight: "400",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Humanity's First Exam",
    template: "%s · Humanity's First Exam",
  },
  description:
    "Positions on machines and human autonomy from 1600–1950, used as a reference list for testing language models.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrument.variable} ${newsreader.variable} ${silkscreen.variable} ${fraktur.variable} ${plexMono.variable} antialiased`}
    >
      <head>
        {/* Apply the saved heading face and colour theme before paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;if(localStorage.getItem("face")==="fraktur")d.dataset.face="fraktur";var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-ink-faint sm:px-8">
            <span>Benjamin Breen · Nathan Davies</span>
            <span className="flex gap-6">
              <Link href="/keys" className="hover:text-ink">Keys</Link>
              <Link href="/coding" className="hover:text-ink">Coding</Link>
            </span>
            <a
              href="https://github.com/benjaminbreen/HumanitysFirstExam"
              className="hover:text-ink"
            >
              Source
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
