import "server-only";

import type { CodeAnalysis } from "@/lib/ai/types";
import { awardProgress, getProgressStats } from "@/lib/db/progress";
import { logEvent } from "@/lib/log";
import { evaluateNewAchievements } from "./evaluate";

/**
 * Award XP for saving an analysis â€” best-effort, never throws.
 * The save succeeds even if progress fails (progress is a bonus, not a gate).
 */
export async function awardProgressForSave(input: {
  language: string;
  analysis: CodeAnalysis;
}): Promise<void> {
  // Base save event: +10 XP, counts toward today's streak.
  const saveResult = await awardProgress({
    type: "save",
    amount: 10,
    meta: { language: input.language },
    countsForStreak: true,
  });
  if (!saveResult.ok) {
    logEvent("progress.error", { step: "save", error: saveResult.error });
    return;
  }

  // Fetch updated stats (total analyses, distinct languages) for predicate evaluation.
  const statsResult = await getProgressStats();
  if (!statsResult.ok) {
    logEvent("progress.error", { step: "stats", error: statsResult.error });
    return;
  }

  // Evaluate and award any newly unlocked achievements.
  const newAchievements = await evaluateNewAchievements({
    progress: saveResult.data,
    stats: statsResult.data,
    timeNotation: input.analysis.time.notation,
  });

  for (const { key, xp } of newAchievements) {
    const achieveResult = await awardProgress({
      type: "achievement",
      amount: xp,
      meta: { key },
    });
    if (!achieveResult.ok) {
      logEvent("progress.error", { step: "achievement", key, error: achieveResult.error });
    } else {
      logEvent("progress.achievement_unlocked", { key });
    }
  }
}

/** Award a small XP bonus for saving reusable code. Best-effort only. */
export async function awardProgressForSnippet(input: {
  language: string;
}): Promise<void> {
  const result = await awardProgress({
    type: "snippet",
    amount: 5,
    meta: { language: input.language },
  });
  if (!result.ok) {
    logEvent("progress.error", { step: "snippet", error: result.error });
  }
}

/** Award a small XP bonus for running code in the playground. Best-effort only. */
export async function awardProgressForExecution(input: {
  language: string;
  status: string;
}): Promise<void> {
  const result = await awardProgress({
    type: "execution",
    amount: input.status === "accepted" ? 3 : 1,
    meta: { language: input.language, status: input.status },
  });
  if (!result.ok) {
    logEvent("progress.error", { step: "execution", error: result.error });
  }
}