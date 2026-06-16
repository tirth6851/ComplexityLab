import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Database,
  Gauge,
  GitBranch,
  LockKeyhole,
  ScanLine,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SectionShell } from "@/components/marketing/section-shell";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { TextScramble } from "@/components/ui/text-scramble";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: `${SITE.name} - AI complexity analysis for developers`,
  description: SITE.description,
};

const features = [
  {
    icon: BrainCircuit,
    title: "AI reasoning with guardrails",
    body: "Groq-powered analysis explains the complexity call, backed by deterministic heuristics when AI is unavailable.",
    className: "sm:col-span-2",
  },
  {
    icon: Gauge,
    title: "Time and space verdicts",
    body: "Readable Big-O results, confidence, metrics, and notes for the exact code you paste.",
    className: "",
  },
  {
    icon: Database,
    title: "Saved history",
    body: "Keep past analyses and snippets tied to your account so interview prep compounds over time.",
    className: "",
  },
  {
    icon: TerminalSquare,
    title: "Developer-native workspace",
    body: "A Monaco-powered editor, sample algorithms, keyboard shortcuts, and result panels that feel familiar.",
    className: "sm:col-span-2",
  },
] as const;

const steps = [
  {
    icon: Code2,
    title: "Paste or load code",
    body: "Start from your own function or a curated sample in TypeScript, Python, Java, Go, Rust, C++, and more.",
  },
  {
    icon: ScanLine,
    title: "Run the analyzer",
    body: "The server evaluates structure, loops, recursion, allocations, and AI feedback without changing your code.",
  },
  {
    icon: BookOpenCheck,
    title: "Save the insight",
    body: "Store the full result, reopen it later, or send the source back into the analyzer for another pass.",
  },
] as const;

const trust = [
  "Clerk Google auth",
  "Supabase history",
  "Server-side analysis",
  "No credit card",
] as const;

function AnalysisPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-ds-xl border border-line bg-card/80 shadow-ds-xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-line-subtle bg-surface-panel/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive" />
            <span className="size-2.5 rounded-full bg-warn" />
            <span className="size-2.5 rounded-full bg-primary" />
          </div>
          <span className="font-mono text-2xs uppercase tracking-label text-ink-muted">
            complexity scan
          </span>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="border-b border-line-subtle bg-[#050816] p-5 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-muted">binary-search.ts</span>
              <Badge variant="info" className="font-mono">sample</Badge>
            </div>
            <pre className="overflow-hidden font-mono text-[12px] leading-6 text-ink-secondary">
              <code>{`function search(items, target) {
  let low = 0;
  let high = items.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (items[mid] === target) return mid;
    items[mid] < target ? low = mid + 1 : high = mid - 1;
  }

  return -1;
}`}</code>
            </pre>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="font-mono text-2xs uppercase tracking-label text-primary">
                AI feedback
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">
                Halving the search window each loop produces logarithmic time.
                Memory stays constant because the algorithm mutates only pointers.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-ds-md border border-line-subtle bg-surface-panel p-3">
                <p className="text-xs text-ink-muted">Time</p>
                <p className="mt-2 font-mono text-xl font-semibold text-primary">
                  O(log n)
                </p>
              </div>
              <div className="rounded-ds-md border border-line-subtle bg-surface-panel p-3">
                <p className="text-xs text-ink-muted">Space</p>
                <p className="mt-2 font-mono text-xl font-semibold text-cx-good">
                  O(1)
                </p>
              </div>
            </div>
            <div className="rounded-ds-md border border-line-subtle bg-surface-panel p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-2xs uppercase tracking-label text-ink-muted">
                  confidence
                </span>
                <span className="font-mono text-xs text-primary">94%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-raised">
                <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-primary to-info shadow-glow-green-soft" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-grid-lines opacity-45 [mask-image:radial-gradient(65%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[68rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-1/3 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-3 z-50 px-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-pill border border-line bg-card/75 px-4 shadow-ds-lg backdrop-blur-xl">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-ink-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
            <Link href="/sign-up" className={buttonClassName({ size: "sm" })}>
              Start
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="relative z-10">
        <section className="mx-auto grid min-h-[92vh] max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-pill border border-line bg-card/70 px-3 py-1 text-xs text-ink-secondary backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary shadow-glow-green" />
              AI complexity analysis for real code
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Understand the cost of{" "}
              <TextScramble
                words={["algorithms", "recursion", "loops", "code"]}
                className="text-primary text-glow-primary"
              />
              .
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-ink-secondary sm:text-lg">
              ComplexityLab turns Big-O into a practical workflow: paste code,
              get AI feedback, compare time and space complexity, and build a
              searchable library of analysis history.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonClassName({ size: "lg" })}>
                Start analyzing
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className={buttonClassName({ variant: "outline", size: "lg" })}
              >
                See how it works
              </a>
            </div>
            <div className="mt-7 grid gap-3 text-sm text-ink-secondary sm:grid-cols-2">
              {trust.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <AnalysisPreview />
          </div>
        </section>

        <SectionShell
          eyebrow="Platform"
          title="The analyzer workspace your algorithms class needed"
          description="A focused product surface for learning, interview prep, and day-to-day code review."
          className="pt-8"
        >
          <div id="features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-ds-xl border border-line bg-card/70 p-6 shadow-ds-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ${feature.className}`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="flex size-11 items-center justify-center rounded-ds-md border border-line bg-surface-panel text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-ink-secondary">
                    {feature.body}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Workflow"
          title="From paste to complexity verdict in seconds"
          description="No profiler setup, no scaffolding, no guesswork. Keep the loop fast and focused."
          className="pt-10"
        >
          <ol id="how-it-works" className="grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative overflow-hidden rounded-ds-xl border border-line bg-card/70 p-6 shadow-ds-md"
                >
                  <span className="absolute right-5 top-4 font-mono text-5xl font-semibold text-primary/10">
                    {index + 1}
                  </span>
                  <span className="flex size-11 items-center justify-center rounded-ds-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </SectionShell>

        <SectionShell className="pt-8">
          <div
            id="pricing"
            className="grid overflow-hidden rounded-ds-xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card shadow-ds-xl lg:grid-cols-[1fr_0.72fr]"
          >
            <div className="p-8 sm:p-10">
              <Badge variant="success">Free start</Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Premium complexity tooling without the procurement ceremony.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base">
                Sign in with Google and start analyzing code immediately. Your
                saved analyses, snippets, and dashboard stay connected to your
                account.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/sign-up" className={buttonClassName({ size: "lg" })}>
                  Get started free
                  <Zap className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/sign-in"
                  className={buttonClassName({ variant: "outline", size: "lg" })}
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="border-t border-line bg-surface-panel/60 p-8 sm:p-10 lg:border-l lg:border-t-0">
              <div className="space-y-4">
                {[
                  [Sparkles, "AI + heuristic analysis"],
                  [BarChart3, "Dashboard activity metrics"],
                  [GitBranch, "Saved snippets and history"],
                  [LockKeyhole, "Authenticated private workspace"],
                ].map(([Icon, label]) => (
                  <div key={label as string} className="flex items-center gap-3 text-sm text-ink-secondary">
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
          <p>Learn how code scales with AI-assisted complexity analysis.</p>
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
