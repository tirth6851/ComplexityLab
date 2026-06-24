import type { Metadata } from "next";
import { CoachShell } from "@/components/learning/coach-shell";

export const metadata: Metadata = {
  title: "OOP Coach · ComplexityLab",
  description:
    "AI feedback on class design, encapsulation, inheritance, and SOLID principles.",
};

const STARTER_PROMPTS = [
  {
    label: "Explain encapsulation",
    message:
      "Explain encapsulation from scratch. Why does it matter, and what does bad encapsulation look like in practice?",
  },
  {
    label: "Composition vs inheritance",
    message:
      "When should I use composition instead of inheritance? Can you show a concrete before-and-after example?",
  },
  {
    label: "Review my class design",
    message:
      "I have a class that handles user data, sends emails, and generates reports. Is that good design? What would you change?",
  },
  {
    label: "Teach me SOLID",
    message:
      "Walk me through the SOLID principles one by one with short, concrete examples. Focus on what violating them looks like.",
  },
  {
    label: "What is polymorphism?",
    message:
      "What is polymorphism and why is it useful? Give me a real-world analogy and then a code example.",
  },
  {
    label: "Spot OOP mistakes",
    message:
      "What are the most common OOP mistakes junior developers make? How do I recognize them in a code review?",
  },
];

export default function OopCoachPage() {
  return (
    <CoachShell
      coachType="oop"
      coachLabel="OOP Coach"
      coachTagline="Object-Oriented Design"
      starterPrompts={STARTER_PROMPTS}
      accentClass="text-info"
    />
  );
}
