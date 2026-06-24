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

/** F2 — persisted XP/level/streak row from `user_progress`. */
export interface ProgressState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  /** UTC date string "YYYY-MM-DD", or null if never saved. */
  lastActiveOn: string | null;
}

/** F2 — one day's aggregated XP for the activity chart. */
export interface DailyXp {
  /** UTC date "YYYY-MM-DD". */
  date: string;
  xp: number;
}

/** F2 — counts used by achievement evaluation. */
export interface ProgressStats {
  totalAnalyses: number;
  distinctLanguages: number;
}

/** F2 — a single unlocked achievement from `xp_events`. */
export interface UnlockedAchievement {
  key: string;
  unlockedAt: string;
}

/** F4 — a chat conversation row (no message content). */
export interface Conversation {
  id: string;
  profileId: string;
  title: string;
  contextType: string | null;
  contextRefId: string | null;
  contextMetadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/** F4 — a single chat message. */
export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokenCount: number | null;
  createdAt: string;
}

/** F4 — today's AI usage aggregates (from ai_usage). */
export interface AiUsageToday {
  messageCount: number;
  tokensIn: number;
  tokensOut: number;
}
