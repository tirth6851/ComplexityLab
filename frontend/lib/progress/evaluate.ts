import "server-only";

import { ACHIEVEMENTS, type AchievementKey } from "./achievements";
import { listUnlockedAchievements } from "@/lib/db/progress";
import type { ProgressState, ProgressStats } from "@/types";

export interface EvaluateInput {
  /** Updated progress state (post-save). */
  progress: ProgressState;
  /** Analysis counts for the user (post-save). */
  stats: ProgressStats;
  /** Big-O time notation of the just-saved analysis. */
  timeNotation: string;
}

/**
 * Return achievements earned by this save but not yet unlocked.
 * Idempotent: the DB-level unique index prevents double-inserts even if called twice.
 */
export async function evaluateNewAchievements(
  input: EvaluateInput,
): Promise<Array<{ key: AchievementKey; xp: number }>> {
  const unlockedRes = await listUnlockedAchievements();
  const alreadyUnlocked = new Set(
    unlockedRes.ok ? unlockedRes.data.map((a) => a.key) : [],
  );

  const earned: Array<{ key: AchievementKey; xp: number }> = [];
  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.key)) continue;
    if (predicate(achievement.key, input)) {
      earned.push({ key: achievement.key, xp: achievement.xp });
    }
  }
  return earned;
}

function predicate(
  key: AchievementKey,
  { progress, stats, timeNotation }: EvaluateInput,
): boolean {
  switch (key) {
    case "first_analysis":
      return stats.totalAnalyses >= 1;
    case "ten_analyses":
      return stats.totalAnalyses >= 10;
    case "streak_7":
      return progress.currentStreak >= 7;
    case "all_languages":
      return stats.distinctLanguages >= 7;
    case "found_factorial":
      return timeNotation === "O(n!)";
  }
}
