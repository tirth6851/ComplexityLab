/**
 * Shared application types. Phase 2 introduces the dashboard domain models
 * (currently backed by mock data in `lib/mock-data.ts`).
 */

export type Complexity =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n²)"
  | "O(2ⁿ)";

export interface Analysis {
  id: string;
  title: string;
  language: string;
  timeComplexity: Complexity;
  spaceComplexity: Complexity;
  /** Human-friendly relative label, e.g. "2h ago" (mock). */
  createdAt: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  tags: string[];
  savedAt: string;
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
