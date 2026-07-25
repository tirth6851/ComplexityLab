import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

/** Shared chrome for static educational content pages (cheat sheets, guides). */
export function ContentPage({
  eyebrow,
  title,
  dek,
  children,
}: {
  eyebrow: string;
  title: string;
  dek: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="ComplexityLab home">
          <Logo />
        </Link>
        <nav aria-label="Site links" className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/complexity-cheatsheet" className="hover:text-foreground">
            Cheat Sheet
          </Link>
          <Link href="/guides/how-to-analyze-time-complexity" className="hover:text-foreground">
            Guide
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
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
