import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Code2,
  Database,
  GitBranch,
  Layers,
  Terminal,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Learning Hub · ComplexityLab",
  description:
    "Guided AI coaching for DSA, OOP, and more — connected to the Analyzer and Playground.",
};

interface CoachCard {
  href: string;
  icon: React.ElementType;
  label: string;
  tagline: string;
  description: string;
  ready: boolean;
}

const COACHES: CoachCard[] = [
  {
    href: "/learning/dsa",
    icon: BrainCircuit,
    label: "DSA Coach",
    tagline: "Algorithms & Data Structures",
    description:
      "Detect patterns in your code, understand complexity trade-offs, and get guided hints toward better approaches.",
    ready: true,
  },
  {
    href: "/learning/oop",
    icon: Layers,
    label: "OOP Coach",
    tagline: "Object-Oriented Design",
    description:
      "Explore encapsulation, inheritance, composition, and abstraction with AI feedback on your class designs.",
    ready: true,
  },
  {
    href: "/learning/git",
    icon: GitBranch,
    label: "Git Coach",
    tagline: "Version Control",
    description:
      "Learn safe Git workflows, resolve merge conflicts, understand rebase, and navigate GitHub collaboration step by step.",
    ready: true,
  },
  {
    href: "/learning/cli",
    icon: Terminal,
    label: "CLI Coach",
    tagline: "Command Line Fundamentals",
    description:
      "Shell scripting, file management, process control, and productivity tips.",
    ready: true,
  },
  {
    href: "/learning/sql",
    icon: Database,
    label: "SQL Coach",
    tagline: "Database & Query Design",
    description:
      "Query optimization, indexing strategies, and schema design principles.",
    ready: true,
  },
];

export default function LearningHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <p className="font-mono text-2xs uppercase tracking-label text-primary">
          Learning Hub
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
          Pick a coach. Start learning.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-ink-secondary">
          Each coach is an AI tutor wired into your Analyzer history and
          Playground. Ask questions, share code, and get explanations built
          for your specific level.
        </p>
      </div>

      {/* Coach grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COACHES.map((coach) => {
          const Icon = coach.icon;
          const card = (
            <div
              className={`flex h-full flex-col rounded-ds-xl border border-[#1E293B] bg-[#0B1120] p-6 shadow-none transition-all duration-200 ${
                coach.ready
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-glow-green-soft group-focus-visible:border-primary/40 group-focus-visible:bg-primary/5 group-focus-visible:shadow-glow-green-soft"
                  : "cursor-default opacity-60"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-ds-lg border border-[#1E293B] bg-[#0B1220] p-2.5 text-ink-muted shadow-none transition-all duration-200 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:text-primary group-hover:shadow-glow-green-soft group-focus-visible:border-primary/35 group-focus-visible:bg-primary/10 group-focus-visible:text-primary group-focus-visible:shadow-glow-green-soft">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                {!coach.ready && (
                  <span className="rounded-ds-xs bg-surface-raised px-2 py-0.5 font-mono text-2xs font-medium uppercase tracking-label text-ink-faint">
                    Soon
                  </span>
                )}
              </div>
              <p className="font-mono text-2xs uppercase tracking-label text-ink-faint">
                {coach.tagline}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink-primary">
                {coach.label}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink-secondary">
                {coach.description}
              </p>
              {coach.ready && (
                <div className="mt-5 flex items-center gap-1.5 font-mono text-xs font-medium text-ink-muted transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Open coach
                </div>
              )}
            </div>
          );

          return coach.ready ? (
            <Link
              key={coach.label}
              href={coach.href}
              className="group flex focus:outline-none"
            >
              {card}
            </Link>
          ) : (
            <div key={coach.label} className="flex" aria-disabled="true">
              {card}
            </div>
          );
        })}
      </div>

      {/* Connection callout */}
      <aside className="rounded-ds-xl border border-line-subtle bg-surface-panel/60 p-5 shadow-inset-well">
        <div className="flex items-start gap-4">
          <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink-primary">
              Works with your existing code
            </p>
            <p className="text-sm leading-6 text-ink-secondary">
              Run an analysis in the{" "}
              <Link href="/analyzer" className="text-primary hover:underline">
                Analyzer
              </Link>{" "}
              and ask your coach to explain it, or bring playground code
              straight into the DSA or OOP conversation.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
