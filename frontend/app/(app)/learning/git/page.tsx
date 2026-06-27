import type { Metadata } from "next";
import { CoachShell } from "@/components/learning/coach-shell";

export const metadata: Metadata = {
  title: "Git Coach - ComplexityLab",
  description:
    "Beginner-friendly coaching for Git commands, branches, merge conflicts, rebasing, and GitHub workflows.",
};

const STARTER_PROMPTS = [
  {
    label: "Explain git status",
    message:
      "Explain git status, git add, and git commit from scratch. What does each command do and when should I use it?",
  },
  {
    label: "Fix non-fast-forward push",
    message:
      "I tried to push and got a non-fast-forward error. What does that mean, and what is the safest way to fix it?",
  },
  {
    label: "Resolve a merge conflict",
    message:
      "Walk me through resolving a Git merge conflict step by step. Explain what I should check before running each command.",
  },
  {
    label: "Rebase vs merge",
    message:
      "What's the difference between rebase and merge? When should I use each one in a team project?",
  },
  {
    label: "Use git stash safely",
    message:
      "Teach me how git stash works. When is it useful, and how do I avoid losing work?",
  },
  {
    label: "Pull request workflow",
    message:
      "Explain a safe GitHub pull request workflow from creating a branch to merging the PR.",
  },
];

export default function GitCoachPage() {
  return (
    <CoachShell
      coachType="git"
      coachLabel="Git Coach"
      coachTagline="Version Control"
      starterPrompts={STARTER_PROMPTS}
      accentClass="text-success"
    />
  );
}
