import type { Analysis, DashboardStat, ProgressMetric, Snippet } from "@/types";

/**
 * Pure dashboard-stat derivations from real rows. `now` is injectable for
 * deterministic tests.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar-day key (UTC) for an ISO timestamp. */
function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Consecutive days (ending today or yesterday) with at least one analysis.
 * "Yesterday" still counts so the streak doesn't break before the user has
 * had today to act.
 */
export function computeDayStreak(
  isoDates: string[],
  now: number = Date.now(),
): number {
  const days = new Set(
    isoDates
      .map((d) => Date.parse(d))
      .filter((ms) => !Number.isNaN(ms))
      .map(dayKey),
  );
  if (days.size === 0) return 0;

  let cursor = now;
  if (!days.has(dayKey(cursor))) {
    cursor -= DAY_MS;
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
}

export function computeDashboardStats(
  analyses: Analysis[],
  snippets: Snippet[],
  now: number = Date.now(),
): DashboardStat[] {
  const weekAgo = now - 7 * DAY_MS;
  const thisWeek = analyses.filter((a) => {
    const t = Date.parse(a.createdAt);
    return !Number.isNaN(t) && t >= weekAgo;
  }).length;

  const languages = new Set(snippets.map((s) => s.language)).size;
  const streak = computeDayStreak(
    analyses.map((a) => a.createdAt),
    now,
  );

  return [
    {
      label: "Analyses",
      value: `${analyses.length}`,
      hint: thisWeek > 0 ? `+${thisWeek} this week` : "none this week",
    },
    {
      label: "Snippets",
      value: `${snippets.length}`,
      hint:
        languages > 0
          ? `${languages} language${languages === 1 ? "" : "s"}`
          : "none saved",
    },
    {
      label: "Day streak",
      value: `${streak}`,
      hint: streak > 0 ? "keep it up" : "analyze to start",
    },
  ];
}

/**
 * Share of analyses per language (top 4), as progress-bar metrics. A simple,
 * honest stand-in for topic mastery until lessons/progress land.
 */
export function computeLanguageMix(analyses: Analysis[]): ProgressMetric[] {
  if (analyses.length === 0) return [];

  const counts = new Map<string, number>();
  for (const a of analyses) {
    counts.set(a.language, (counts.get(a.language) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([language, count]) => ({
      label: language,
      value: Math.round((count / analyses.length) * 100),
    }));
}
