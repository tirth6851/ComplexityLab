import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

/** Shared chrome for the public legal pages (/privacy, /terms). */
export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="ComplexityLab home">
          <Logo />
        </Link>
        <nav aria-label="Site links" className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="font-display text-4xl font-bold tracking-normal">{title}</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-label text-ink-muted">
          Effective {effectiveDate}
        </p>
        <div className="mt-8 space-y-8">{children}</div>
      </main>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-normal">{heading}</h2>
      <div className="space-y-3 text-base leading-7 text-ink-secondary">
        {children}
      </div>
    </section>
  );
}
