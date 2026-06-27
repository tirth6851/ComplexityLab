import type { Metadata } from "next";
import { CoachShell } from "@/components/learning/coach-shell";

export const metadata: Metadata = {
  title: "CLI Coach - ComplexityLab",
  description:
    "Beginner-friendly coaching for shell scripting, file management, process control, terminal commands, and productivity tips.",
};

const STARTER_PROMPTS = [
  {
    label: "Explain terminal basics",
    message:
      "Explain pwd, ls, and cd from scratch. What does each command do, and how do I safely navigate folders from the terminal?",
  },
  {
    label: "Find files safely",
    message:
      "How do I search for files or text from the terminal? Show safe examples using find or grep and explain each command.",
  },
  {
    label: "Move and copy files",
    message:
      "Teach me how cp and mv work. What should I check before copying, moving, or overwriting files?",
  },
  {
    label: "Understand npm commands",
    message:
      "Explain common npm commands like npm install, npm run dev, npm run build, and npm run test. What does each one do?",
  },
  {
    label: "Process control",
    message:
      "How do I see running processes and stop one safely? Explain ps, tasklist, Ctrl+C, and kill with safety warnings.",
  },
  {
    label: "Shell scripting starter",
    message:
      "Teach me a beginner-friendly shell scripting workflow. Start with variables, echo, conditionals, and safe file checks.",
  },
];

export default function CliCoachPage() {
  return (
    <CoachShell
      coachType="cli"
      coachLabel="CLI Coach"
      coachTagline="Command Line Fundamentals"
      starterPrompts={STARTER_PROMPTS}
      accentClass="text-info"
    />
  );
}
