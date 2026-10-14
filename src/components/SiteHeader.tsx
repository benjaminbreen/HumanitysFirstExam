"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";

const nav = [
  { href: "/", label: "Themes" },
  { href: "/sources", label: "Sources" },
  { href: "/search", label: "Search" },
  { href: "/models", label: "Models" },
  { href: "/method", label: "Method" },
  { href: "/about", label: "About" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/themes") || pathname.startsWith("/questions");
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-10 px-4 sm:px-8">
        <Link
          href="/"
          className="py-4 font-pixel text-[16px] leading-none text-ink min-[400px]:text-[24px]"
        >
          <Wordmark />
        </Link>
        <nav className="-mb-px flex flex-1 flex-wrap gap-x-6 text-[15px]">
          {nav.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 py-4 ${
                  active
                    ? "border-rule text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <span className="ml-auto">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}
