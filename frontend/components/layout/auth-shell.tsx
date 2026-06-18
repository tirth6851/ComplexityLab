import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Code2, History, ShieldCheck } from "lucide-react";
import { Logo } from "./logo";

const authSignals = [
  { icon: Code2, label: "Analyze code complexity" },
  { icon: History, label: "Keep saved history" },
  { icon: ShieldCheck, label: "Protected workspace" },
] as const;

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-lines opacity-45"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
      />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-ds-xl border border-line-subtle bg-card/78 shadow-ds-xl backdrop-blur-xl lg:grid-cols-[1fr_0.9fr]">
        <section className="relative p-8 sm:p-10">
          <div className="mb-8 flex justify-center lg:justify-start">
            <Logo />
          </div>
          <div className="premium-panel rounded-ds-xl p-6 sm:p-8">
            <div
              aria-hidden
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            />
            <div className="mb-6 text-center lg:text-left">
              <p className="font-mono text-2xs uppercase tracking-label text-primary">
                Secure workspace
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-normal">
                {title}
              </h1>
              <p className="mt-3 text-base leading-7 text-ink-secondary">
                {subtitle}
              </p>
            </div>
            {children}
            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
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
          <p className="mt-6 text-center text-sm text-ink-secondary lg:text-left">
            {footer}
          </p>
        </section>

        <aside className="hidden border-l border-line-subtle bg-surface-panel/45 p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="font-mono text-2xs uppercase tracking-label text-primary">
                ComplexityLab account
              </p>
              <h2 className="mt-4 max-w-sm font-display text-4xl font-semibold leading-tight">
                Your Big-O practice, saved where you left it.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-ink-secondary">
                Sign in once, then analyze code, save useful traces, and build a history of patterns you can revisit before interviews.
              </p>
            </div>
            <div className="space-y-3">
              {authSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div
                    key={signal.label}
                    className="flex items-center gap-3 rounded-ds-lg border border-line-subtle bg-card/65 p-3 text-sm text-ink-secondary shadow-inset-well"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-ds-md border border-line-accent bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>{signal.label}</span>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-primary" aria-hidden />
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
