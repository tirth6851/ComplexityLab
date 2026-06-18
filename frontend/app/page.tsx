import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Code2,
  Database,
  Gauge,
  History,
  ScanLine,
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
  },
  {
    icon: BookOpenCheck,
    title: "Lessons",
    body: "Learn Big-O patterns through visual tracing flows and guided examples.",
  },
  {
    icon: BrainCircuit,
    title: "Quiz",
    body: "Practice identifying complexity from loops, recursion, data structures, and optimization tradeoffs.",
  },
  {
    icon: History,
    title: "History",
    body: "Revisit saved analyses and snippets so your interview prep compounds over time.",
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
          title="Everything points back to better complexity intuition"
          description="The homepage navigation mirrors the product loop: analyze, learn, practice, review, and return with stronger instincts."
          className="pt-16"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  id={card.title === "Lessons" ? "lessons" : card.title === "Quiz" ? "quiz" : undefined}
                  className="rounded-ds-xl border border-line-subtle bg-card/70 p-6 shadow-ds-lg backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/35"
                >
                  <span className="flex size-11 items-center justify-center rounded-ds-md border border-line-accent bg-surface-panel text-primary shadow-inset-well">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
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
          eyebrow="Visual code tracing"
          title="Move from answer memorization to execution understanding"
          description="ComplexityLab keeps the existing analyzer, account, dashboard, and history flows intact while giving students a sharper visual model for Big-O."
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
                Start analyzing code with the workflow already in your account.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base">
                Authentication, saved history, dashboard data, and the AI
                analyzer routes remain wired into the existing ComplexityLab
                app.
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
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
