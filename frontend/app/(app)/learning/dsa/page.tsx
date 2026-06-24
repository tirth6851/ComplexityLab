import type { Metadata } from "next";
import { CoachShell } from "@/components/learning/coach-shell";

export const metadata: Metadata = {
  title: "DSA Coach · ComplexityLab",
  description:
    "Identify algorithmic patterns, understand complexity, and get guided hints toward better solutions.",
};

const STARTER_PROMPTS = [
  {
    label: "Explain sliding window",
    message:
      "Can you explain the sliding window technique from scratch? When should I use it, and what does it look like in code?",
  },
  {
    label: "What's wrong with my O(n²) approach?",
    message:
      "I wrote a nested loop solution that works but it's O(n²). How do I know if there's a more efficient way, and what should I look for?",
  },
  {
    label: "Teach me dynamic programming",
    message:
      "Teach me dynamic programming in 'teach me this' mode. Start from first principles, give me an analogy, then show a concrete example.",
  },
  {
    label: "Which pattern is this?",
    message:
      "I have a problem: given an array, find two numbers that add up to a target. I'm looping through every pair — can you tell me which DSA pattern this is and if there's a better way?",
  },
  {
    label: "Graph traversal: BFS vs DFS",
    message:
      "What's the difference between BFS and DFS? When would I pick one over the other?",
  },
  {
    label: "Next topic to practice",
    message:
      "I'm comfortable with arrays and hash maps. What should I learn next to get better at interviews, and why?",
  },
];

export default function DsaCoachPage() {
  return (
    <CoachShell
      coachType="dsa"
      coachLabel="DSA Coach"
      coachTagline="Algorithms & Data Structures"
      starterPrompts={STARTER_PROMPTS}
      accentClass="text-primary"
    />
  );
}
