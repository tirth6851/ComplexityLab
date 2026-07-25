import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/constants/site";

export const metadata: Metadata = {
  title: `About · ${SITE.name}`,
  description:
    "Learn about ComplexityLab — the team behind it, the mission, and the technologies that power it.",
  alternates: { canonical: "/about" },
};

const CONTACT_EMAIL = "tirth2093@gmail.com";
const TEAM_CONTACT_EMAIL = "tkpatel10902@gmail.com";

const TECH_STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "Clerk",
  "Groq AI",
  "Judge0",
  "Vercel",
] as const;


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="ComplexityLab home">
          <Logo />
        </Link>
        <nav aria-label="Site links" className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Terms
          </Link>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        {/* Hero */}
        <section className="pb-14 text-center" aria-labelledby="about-heading">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            About
          </p>
          <h1
            id="about-heading"
            className="mt-3 font-display text-4xl font-bold tracking-normal sm:text-5xl"
          >
            About ComplexityLab
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink-secondary sm:text-lg">
            Helping developers master algorithms, computational complexity, and
            technical interviews through AI-powered learning.
          </p>
        </section>

        {/* Mission */}
        <section
          aria-labelledby="mission-heading"
          className="mb-14 rounded-ds-xl border border-line-subtle bg-card/70 p-8 shadow-ds-lg sm:p-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Mission
          </p>
          <h2
            id="mission-heading"
            className="mt-3 font-display text-2xl font-semibold tracking-normal sm:text-3xl"
          >
            Making algorithm learning interactive and practical
          </h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-ink-secondary">
            <p>
              ComplexityLab was created to make algorithm learning more
              interactive, practical, and accessible. Understanding Big-O
              notation should not require memorizing textbook definitions — it
              should emerge from analyzing real code, seeing patterns, and
              building intuition over time.
            </p>
            <p>
              The platform helps developers understand{" "}
              <em>why</em> solutions work through AI coaching, code
              analysis, visual complexity explanations, saved learning history,
              and hands-on practice. Every feature is designed to compound your
              understanding, not just give you an answer.
            </p>
          </div>
        </section>

        {/* Contributors */}
        <section aria-labelledby="team-heading" className="mb-14">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Built by
            </p>
            <h2
              id="team-heading"
              className="mt-3 font-display text-2xl font-semibold tracking-normal"
            >
              The team
            </h2>
          </div>
          <div className="rounded-ds-xl border border-line-subtle bg-card/70 p-7 shadow-ds-lg">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-surface-panel text-primary shadow-inset-well"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-normal text-ink-primary">
                  Tirth Patel
                </h3>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.15em] text-primary">
                  Full Stack Developer
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-secondary">
                  Focused on full-stack development, AI-powered developer tools, and user experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section aria-labelledby="stack-heading" className="mb-14">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Technology
            </p>
            <h2
              id="stack-heading"
              className="mt-3 font-display text-2xl font-semibold tracking-normal"
            >
              Built with
            </h2>
          </div>
          <div className="rounded-ds-xl border border-line-subtle bg-card/70 p-8 shadow-ds-lg">
            <div className="flex flex-wrap gap-3">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-ds-md border border-line-subtle bg-surface-panel px-4 py-2 font-mono text-sm text-ink-secondary shadow-inset-well transition-colors hover:border-line-accent hover:text-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section aria-labelledby="contact-heading" className="mb-14">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Contact
            </p>
            <h2
              id="contact-heading"
              className="mt-3 font-display text-2xl font-semibold tracking-normal"
            >
              Get in touch
            </h2>
          </div>
          <div className="rounded-ds-xl border border-line-subtle bg-card/70 p-8 shadow-ds-lg">
            <p className="text-sm leading-6 text-ink-secondary">
              Questions, feedback, or anything else — reach the ComplexityLab
              team at:
            </p>
            <ul className="mt-5 space-y-3" aria-label="Contact emails">
              {[CONTACT_EMAIL, TEAM_CONTACT_EMAIL].map((email) => (
                <li key={email}>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 font-mono text-sm text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing */}
        <section className="py-10 text-center" aria-label="Closing message">
          <Badge variant="success">Open to everyone</Badge>
          <p className="mt-5 font-display text-2xl font-semibold tracking-normal sm:text-3xl">
            Thank you for using ComplexityLab.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-secondary">
            We hope it helps you build lasting intuition for algorithms and
            complexity — one analysis at a time.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/analyzer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-ds-md border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_34px_-18px_rgba(0,229,153,0.95)] transition-all duration-150 ease-ds hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open Analyzer
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-ds-md border border-line-subtle bg-card/45 px-4 text-sm font-medium text-ink-primary shadow-ds-sm transition-all duration-150 ease-ds hover:border-primary/35 hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Home
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 text-sm text-ink-muted sm:px-6 md:flex-row md:items-center md:justify-between">
          <Logo />
          <p>Master Big-O with visual code tracing.</p>
          <nav aria-label="Legal links" className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Terms
            </Link>
            <Link
              href="/about"
              aria-current="page"
              className="text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              About
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
