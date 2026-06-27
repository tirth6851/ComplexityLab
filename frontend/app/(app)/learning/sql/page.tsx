import type { Metadata } from "next";
import { CoachShell } from "@/components/learning/coach-shell";

export const metadata: Metadata = {
  title: "SQL Coach - ComplexityLab",
  description:
    "Beginner-friendly coaching for SQL basics, query optimization, indexing strategies, and schema design principles.",
};

const STARTER_PROMPTS = [
  {
    label: "Explain SELECT basics",
    message:
      "Explain SELECT, WHERE, ORDER BY, and LIMIT from scratch. Show a simple example and explain each clause.",
  },
  {
    label: "Understand JOINs",
    message:
      "Teach me INNER JOIN vs LEFT JOIN with a small example. How do foreign keys relate to joins?",
  },
  {
    label: "Optimize a slow query",
    message:
      "Walk me through how to debug a slow SQL query. What should I check before adding an index?",
  },
  {
    label: "Indexing strategy",
    message:
      "Explain database indexes in beginner-friendly terms. When should I add one, and when can indexes hurt performance?",
  },
  {
    label: "Schema design",
    message:
      "Help me design a normalized schema. Explain tables, relationships, primary keys, and foreign keys step by step.",
  },
  {
    label: "Supabase query help",
    message:
      "Explain how PostgreSQL and Supabase queries work together. What should I know about filtering, relationships, and performance?",
  },
];

export default function SqlCoachPage() {
  return (
    <CoachShell
      coachType="sql"
      coachLabel="SQL Coach"
      coachTagline="Database & Query Design"
      starterPrompts={STARTER_PROMPTS}
      accentClass="text-primary"
    />
  );
}
