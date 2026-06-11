import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bookmark,
  Code2,
  Gauge,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: `${SITE.name} — See the complexity behind your code`,
  description: SITE.description,
};

const FEATURES = [
  {
    icon: Gauge,
    title: "Visualize complexity",
    body: "Time and space cost rendered as readable, animated instrument readouts — Big-O made tangible, not abstract.",
  },
  {
    icon: Sparkles,
    title: "AI with a safety net",
    body: "AI-powered analysis that shows its reasoning — backed by a deterministic engine that answers instantly if the AI ever can't.",
  },
  {
    icon: Bookmark,
    title: "A library that compounds",
    body: "Save analyses and snippets, reopen full results anytime, and watch streaks and language stats build real intuition.",
  },
];

/** The actual product loop — every claim here is shipped. */
const HOW_IT_WORKS = [
  {
    icon: Code2,
    title: "Paste your code",
    body: "Drop in a function — TypeScript, JavaScript, Python, Java, Go, Rust, or C++ — or load one of 18 curated samples.",
  },
  {
    icon: ScanLine,
    title: "Run the analysis",
    body: "Get time and space complexity with metric gauges, growth curves on a log scale, and notes on what the engine saw.",
  },
  {
    icon: Bookmark,
    title: "Save and revisit",
    body: "Keep the full breakdown in your library and reopen any analysis later, rendered exactly as it was.",
  },
];

/** Big-O scale, mapped to the complexity gradient (cheap → costly). */
const SCALE = [
  { label: "O(1)", level: 1 as const },
  { label: "O(log n)", level: 1 as const },
  { label: "O(n)", level: 2 as const },
  { label: "O(n log n)", level: 3 as const },
  { label: "O(n²)", level: 4 as const },
  { label: "O(2ⁿ)", level: 5 as const },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Ambient backdrop: lab grid + signal-green glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-lab-grid opacity-40 [mask-image:radial-gradient(70%_55%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={buttonClassName({ size: "sm" })}
          >
            Get started
          </Link>
        </nav>
      </header>

      <main id="main" className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:pt-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Computational complexity, made visual
            </span>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              See the{" "}
              <span className="text-primary text-glow-primary">complexity</span>{" "}
              behind your code.
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              ComplexityLab turns Big-O into something you can see. Analyze
              algorithms, watch time and space cost unfold, and build real
              intuition for how code scales.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className={buttonClassName({ size: "lg" })}
              >
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

            <p className="mt-4 text-xs text-muted-foreground">
              Free to start · Sign in with Google · No credit card
            </p>
          </div>

          {/* 3D analysis readout */}
          <div className="scene-3d animate-rise [animation-delay:120ms]">
            <div className="relative mx-auto w-full max-w-md">
              {/* layered depth card */}
              <div
                aria-hidden
                className="absolute inset-0 translate-x-6 translate-y-8 rounded-2xl border border-border bg-card/40"
              />
              <div className="tilt-3d animate-float relative rounded-2xl border border-border bg-card/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-complexity-1" />
                    <span className="font-mono text-xs text-muted-foreground">
                      quickSort.ts
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    analysis
                  </span>
                </div>

                <pre className="mt-3 overflow-hidden font-mono text-[11px] leading-relaxed text-muted-foreground">
                  <code>{`function quickSort(a) {
  if (a.length <= 1) return a;
  const p = partition(a);
  return [
    ...quickSort(p.left),
    p.pivot,
    ...quickSort(p.right),
  ];
}`}</code>
                </pre>

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Time</span>
                    <Badge complexity={3} className="font-mono">
                      O(n log n)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Space</span>
                    <Badge variant="outline" className="font-mono">
                      O(log n)
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[58%] rounded-full bg-gradient-to-r from-complexity-1 via-complexity-3 to-complexity-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6"
        >
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              From paste to verdict in seconds
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Three steps. No setup, no profiler, no configuration.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-border bg-card/60 p-6 backdrop-blur"
                >
                  <span className="absolute right-5 top-4 font-mono text-3xl font-semibold text-primary/15">
                    {i + 1}
                  </span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Feature trio */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Complexity gradient band */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card/50 p-8 backdrop-blur sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold tracking-tight">
                  One language for cost
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Every analysis speaks the same visual scale — from constant
                  time to exponential — so complexity is obvious at a glance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SCALE.map((s) => (
                  <Badge
                    key={s.label}
                    complexity={s.level}
                    className="font-mono text-[13px]"
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full bg-gradient-to-r from-complexity-1 via-complexity-3 to-complexity-5" />
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-14">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Build complexity intuition that compounds.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Join ComplexityLab and turn abstract Big-O into a skill you can
              feel.
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                href="/sign-up"
                className={buttonClassName({ size: "lg" })}
              >
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
          <p>
            © {new Date().getFullYear()} {SITE.name}. Learn how code scales.
          </p>
        </div>
      </footer>
    </div>
  );
}
