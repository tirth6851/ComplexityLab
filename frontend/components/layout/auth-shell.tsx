import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./logo";

/** Centered, branded container shared by the sign-in and sign-up pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-lines opacity-45"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="premium-panel rounded-ds-xl p-8 sm:p-10">
          <div
            aria-hidden
            className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
          />
          <div className="mb-6 text-center">
            <p className="font-mono text-2xs uppercase tracking-label text-primary">
              Secure workspace
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-normal">{title}</h1>
            <p className="mt-3 text-base leading-7 text-ink-secondary">{subtitle}</p>
          </div>
          {children}
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-ink-secondary">{footer}</p>
      </div>
    </main>
  );
}
