import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { SiteSearchTrigger } from "@/components/marketing/site-search";

/** Formats an ISO date ("2026-08-15") as "August 15, 2026" without pulling in a date library. */
function formatLastUpdated(isoDate: string): string {
  // Parsed as UTC noon (not midnight) so the local-timezone conversion Intl performs
  // can never roll the date back a day for timezones west of UTC.
  const date = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Shared chrome for static educational content pages (cheat sheets, guides). */
export function ContentPage({
  eyebrow,
  title,
  dek,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  dek: string;
  /** ISO date string ("2026-08-15") sourced from real edit history — never fabricated. */
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* `flex-wrap` + `min-h` (not a fixed `h-16`): at ~390px the nav row no
          longer fit alongside the logo + search trigger on one line (was
          silently breaking "Cheat Sheet" onto two lines mid-word, confirmed
          on a real mobile viewport). Every link stays reachable — the whole
          nav wraps onto its own row instead of any link being hidden or the
          text breaking. */}
      <header
        data-print-hide
        className="mx-auto flex min-h-16 max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6"
      >
        <Link href="/" aria-label="ComplexityLab home">
          <Logo />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <nav
            aria-label="Site links"
            className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
          >
            <Link href="/complexity-cheatsheet" className="whitespace-nowrap hover:text-foreground">
              Cheat Sheet
            </Link>
            <Link href="/guides/how-to-analyze-time-complexity" className="whitespace-nowrap hover:text-foreground">
              Guide
            </Link>
            <Link href="/faq" className="whitespace-nowrap hover:text-foreground">
              FAQ
            </Link>
            <Link href="/about" className="whitespace-nowrap hover:text-foreground">
              About
            </Link>
          </nav>
          <SiteSearchTrigger />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-label text-ink-muted">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-normal">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-secondary">
          {dek}
        </p>
        {lastUpdated && (
          <p className="mt-3 text-sm text-ink-muted">
            Last updated{" "}
            <time dateTime={lastUpdated}>{formatLastUpdated(lastUpdated)}</time>
          </p>
        )}
        <div className="mt-10 space-y-10">{children}</div>
      </main>
    </div>
  );
}

export function ContentSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold tracking-normal">
        {heading}
      </h2>
      <div className="space-y-3 text-base leading-7 text-ink-secondary">
        {children}
      </div>
    </section>
  );
}

/** Inline or block code, styled consistently with the rest of the content pages. */
export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-ds-md border border-line bg-surface-panel/60 p-4 text-sm leading-6">
      <code className="font-mono text-ink-primary">{children}</code>
    </pre>
  );
}
