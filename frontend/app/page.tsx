import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Code2,
  Database,
  Gauge,
  History,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HeroSectionNexus } from "@/components/ui/hero-section-nexus";
import { SectionShell } from "@/components/marketing/section-shell";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: `${SITE.name} - Master Big-O with Visual Code Tracing`,
  description:
    "Analyze code, understand time and space complexity, visualize execution flow, and improve solutions with AI-powered guidance.",
};

const platformCards = [
  {
    icon: ScanLine,
    title: "Analyzer",
    body: "Paste code, run the AI complexity analyzer, and get time and space verdicts with confidence metrics.",
    accent: "Core workflow",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    body: "Track your analysis activity, recent work, and saved complexity patterns in one focused workspace.",
    accent: "Workspace",
  },
  {
    icon: History,
    title: "History",
    body: "Revisit saved analyses so your interview prep compounds over time.",
    accent: "Saved memory",
  },
  {
    icon: Code2,
    title: "Snippets",
    body: "Save useful code examples and return to the traces that helped you understand them.",
    accent: "Code library",
  },
] as const;

const workflow = [
  {
    icon: Code2,
    title: "Trace execution",
    body: "Follow loops, branches, recursion, and allocation patterns in a developer-native workspace.",
  },
  {
    icon: Gauge,
    title: "Read Big-O clearly",
    body: "See time and space complexity side-by-side with notes explaining why the verdict was chosen.",
  },
  {
    icon: Database,
    title: "Save understanding",
    body: "Persist useful analyses with Supabase-backed history and reopen them whenever you need a refresher.",
  },
] as const;

const trustSignals = [
  {
    icon: ShieldCheck,
    title: "Server-side analysis",
    body: "The analyzer runs through protected app routes, keeping product logic out of the browser.",
  },
  {
    icon: LockKeyhole,
    title: "Private workspace",
    body: "Clerk authentication protects saved analyses, snippets, dashboard data, and account settings.",
  },
  {
    icon: Sparkles,
    title: "AI with guardrails",
    body: "AI feedback is paired with structured complexity fields so results stay readable and reviewable.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <HeroSectionNexus />

      <main id="main" className="relative z-10">
        <SectionShell
          eyebrow="ComplexityLab platform"
          title="A focused loop for understanding complexity"
          description="Analyze real code, read the reasoning behind each verdict, save useful snippets, and return to your history when you need the pattern again."
          className="pt-16"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}


                  className="group rounded-ds-xl border border-line-subtle bg-card/70 p-6 shadow-ds-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/35 hover:bg-surface-panel/70 hover:shadow-glow-green-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-ds-md border border-line-accent bg-surface-panel text-primary shadow-inset-well transition group-hover:shadow-glow-green-soft">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                      {card.accent}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-xl font-semibold tracking-normal">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Trust and privacy"
          title="Built like a developer workspace, not a toy demo"
          description="ComplexityLab keeps the product surface compact while preserving real auth, persistence, dashboard history, and structured AI results."
          className="pt-8"
        >
          <div className="grid overflow-hidden rounded-ds-xl border border-line-subtle bg-card/75 shadow-ds-xl lg:grid-cols-[0.85fr_1fr]">
            <div className="border-b border-line-subtle bg-surface-panel/45 p-8 lg:border-b-0 lg:border-r">
              <Badge variant="success">Production-minded</Badge>
              <h2 className="mt-5 max-w-md font-display text-3xl font-semibold leading-tight tracking-normal">
                Clear answers, saved context, and a workspace you can return to.
              </h2>
              <p className="mt-4 text-sm leading-6 text-ink-secondary">
                The strongest developer tools feel calm because they make system state obvious. ComplexityLab follows that pattern across analysis, saving, and review.
              </p>
            </div>
            <div className="grid gap-3 p-5 sm:p-6">
              {trustSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div
                    key={signal.title}
                    className="rounded-ds-lg border border-line-subtle bg-surface-panel/45 p-4 shadow-inset-well"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink-primary">
                          {signal.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-ink-secondary">
                          {signal.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Visual code tracing"
          title="Move from answer memorization to execution understanding"
          description="The analyzer is designed to make the reason behind Big-O visible: where the loops branch, where recursion grows, and where memory changes."
          className="pt-8"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {workflow.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-ds-xl border border-line-subtle bg-card/70 p-6 shadow-ds-lg"
                >
                  <span className="flex size-11 items-center justify-center rounded-ds-md border border-line-accent bg-primary/10 text-primary shadow-inset-well">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h2 className="mt-5 font-display text-xl font-semibold tracking-normal">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell className="pt-8">
          <div className="grid overflow-hidden rounded-ds-xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card shadow-ds-xl lg:grid-cols-[1fr_0.72fr]">
            <div className="p-8 sm:p-10">
              <Badge variant="success">Start free</Badge>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-normal sm:text-4xl">
                Start with one function. Leave with a reusable complexity trace.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base">
                Authentication, saved history, dashboard data, and the AI analyzer routes remain wired into the existing ComplexityLab app.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/analyzer" className={buttonClassName({ size: "lg" })}>
                  Start Analyzing
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonClassName({ variant: "outline", size: "lg" })}
                >
                  Dashboard
                </Link>
                <Link
                  href="/guides/how-to-analyze-time-complexity"
                  className={buttonClassName({ variant: "outline", size: "lg" })}
                >
                  New to Big-O? Start here
                </Link>
              </div>
            </div>
            <div className="border-t border-line bg-surface-panel/60 p-8 sm:p-10 lg:border-l lg:border-t-0">
              <div className="space-y-4">
                {[
                  [ScanLine, "AI-powered code analysis"],
                  [BarChart3, "Dashboard learning metrics"],
                  [History, "Saved analysis history"],
                  [Database, "Supabase-backed persistence"],
                ].map(([Icon, label]) => (
                  <div
                    key={label as string}
                    className="flex items-center gap-3 text-sm text-ink-secondary"
                  >
                    <span className="flex size-9 items-center justify-center rounded-ds-md border border-line bg-card text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {label as string}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionShell>
      </main>

      <footer className="relative z-10 border-t border-line bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-ink-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Logo />
          <p>Master Big-O with visual code tracing.</p>
          <nav aria-label="Legal links" className="flex gap-4">
            <Link href="/complexity-cheatsheet" className="hover:text-foreground">
              Cheat Sheet
            </Link>
            <Link href="/guides/how-to-analyze-time-complexity" className="hover:text-foreground">
              Guide
            </Link>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link href="/changelog" className="hover:text-foreground">
              Changelog
            </Link>
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
        </div>
      </footer>
    </div>
  );
}
