/**
 * Shared application domain types. Analyses and snippets are persisted in
 * Supabase (see `lib/db`); rows are mapped into these shapes for the UI.
 */

import type { CodeAnalysis } from "@/lib/ai/types";

/** Canonical Big-O classes the visual system has dedicated stops for. */
export type Complexity =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n²)"
  | "O(n³)"
  | "O(2ⁿ)"
  | "O(n!)";

export interface Analysis {
  id: string;
  title: string;
  language: string;
  /** Big-O notation, e.g. "O(n log n)". Free-form to tolerate future engines. */
  timeComplexity: string;
  spaceComplexity: string;
  /** One-sentence summary from the engine. */
  verdict: string;
  /** ISO timestamp. Render with `timeAgo()` from lib/format. */
  createdAt: string;
}

/** `Analysis` extended with the stored source code and full engine result. */
export interface AnalysisDetail extends Analysis {
  code: string;
  result: CodeAnalysis | null;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  /** ISO timestamp. */
  savedAt: string;
}

export interface Profile {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  preferredLanguage: string;
  /** ISO timestamp. */
  createdAt: string;
}

export interface ProgressMetric {
  label: string;
  /** Completion percentage, 0–100. */
  value: number;
}

export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}
