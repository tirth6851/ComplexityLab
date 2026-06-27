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
  accent: string;
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
    accent: "text-primary border-primary/20 bg-primary/5",
  },
  {
    href: "/learning/oop",
    icon: Layers,
    label: "OOP Coach",
    tagline: "Object-Oriented Design",
    description:
      "Explore encapsulation, inheritance, composition, and abstraction with AI feedback on your class designs.",
    ready: true,
    accent: "text-info border-info/20 bg-info/5",
  },
  {
    href: "/learning/git",
    icon: GitBranch,
    label: "Git Coach",
    tagline: "Version Control",
    description:
      "Learn safe Git workflows, resolve merge conflicts, understand rebase, and navigate GitHub collaboration step by step.",
    ready: true,
    accent: "text-success border-success/20 bg-success/5",
  },
  {
    href: "#",
    icon: Terminal,
    label: "CLI Coach",
    tagline: "Command Line Fundamentals",
    description:
      "Coming soon — shell scripting, file management, process control, and productivity tips.",
    ready: false,
    accent: "text-ink-muted border-line-subtle bg-surface-panel/50",
  },
  {
    href: "#",
    icon: Database,
    label: "SQL Coach",
    tagline: "Database & Query Design",
    description:
      "Coming soon — query optimization, indexing strategies, and schema design principles.",
    ready: false,
    accent: "text-ink-muted border-line-subtle bg-surface-panel/50",
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
              className={`group flex h-full flex-col rounded-ds-xl border p-6 shadow-ds-sm transition-all duration-200 ${
                coach.ready
                  ? "cursor-pointer hover:shadow-ds-md hover:-translate-y-0.5"
                  : "cursor-default opacity-60"
              } ${coach.accent}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-ds-lg border p-2.5 ${coach.accent}`}>
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
                <div className="mt-5 flex items-center gap-1.5 font-mono text-xs font-medium text-primary">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Open coach
                </div>
              )}
            </div>
          );

          return coach.ready ? (
            <Link key={coach.label} href={coach.href} className="flex">
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
