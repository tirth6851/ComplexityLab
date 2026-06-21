import "server-only";

import type {
  DailyXp,
  ProgressState,
  ProgressStats,
  UnlockedAchievement,
} from "@/types";
import { dbError, getAdminClient, type DbResult } from "./admin";
import { getOrCreateProfile } from "./profiles";

/** Current XP/level/streak for the signed-in user. Creates the row if absent. */
export async function getProgress(): Promise<DbResult<ProgressState>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("user_progress")
      .select("xp, level, current_streak, longest_streak, last_active_on")
      .eq("profile_id", profile.data.id)
      .maybeSingle();
    if (res.error) throw res.error;
    if (!res.data) {
      // Row not yet created (first-ever save hasn't run yet).
      return {
        ok: true,
        data: {
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveOn: null,
        },
      };
    }
    return { ok: true, data: mapProgress(res.data) };
  } catch (e) {
    return dbError(e, "Could not load your progress.");
  }
}

export interface ProgressEventInput {
  type: string;
  amount: number;
  meta?: Record<string, unknown>;
  countsForStreak?: boolean;
}

/** Call the atomic `apply_progress_event` RPC; returns the updated state. */
export async function awardProgress(
  event: ProgressEventInput,
): Promise<DbResult<ProgressState>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db.rpc("apply_progress_event", {
      p_profile: profile.data.id,
      p_type: event.type,
      p_amount: event.amount,
      p_meta: event.meta ?? {},
      p_counts_for_streak: event.countsForStreak ?? false,
    });
    if (res.error) throw res.error;
    return { ok: true, data: mapProgress(res.data as UserProgressRow) };
  } catch (e) {
    return dbError(e, "Could not award progress.");
  }
}

/**
 * Aggregate XP earned per UTC day over the last `days` days.
 * Groups in application code (PostgREST doesn't support GROUP BY).
 */
export async function listXpHistory(days = 30): Promise<DbResult<DailyXp[]>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const res = await db
      .from("xp_events")
      .select("created_at, amount")
      .eq("profile_id", profile.data.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (res.error) throw res.error;

    const byDay = new Map<string, number>();
    for (const row of res.data ?? []) {
      const day = (row.created_at as string).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + (row.amount as number));
    }
    const history: DailyXp[] = Array.from(byDay.entries()).map(([date, xp]) => ({
      date,
      xp,
    }));
    return { ok: true, data: history };
  } catch (e) {
    return dbError(e, "Could not load XP history.");
  }
}

/** All achievement xp_events rows — the unlocked set for the signed-in user. */
export async function listUnlockedAchievements(): Promise<
  DbResult<UnlockedAchievement[]>
> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db
      .from("xp_events")
      .select("meta, created_at")
      .eq("profile_id", profile.data.id)
      .eq("type", "achievement")
      .order("created_at", { ascending: true });
    if (res.error) throw res.error;

    const unlocked: UnlockedAchievement[] = (res.data ?? [])
      .filter((r) => (r.meta as Record<string, unknown>)?.key)
      .map((r) => ({
        key: (r.meta as Record<string, string>).key,
        unlockedAt: r.created_at as string,
      }));
    return { ok: true, data: unlocked };
  } catch (e) {
    return dbError(e, "Could not load achievements.");
  }
}

/** Analysis counts used by achievement evaluation. */
export async function getProgressStats(): Promise<DbResult<ProgressStats>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const [countRes, langRes] = await Promise.all([
      db
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.data.id),
      db
        .from("analyses")
        .select("language")
        .eq("profile_id", profile.data.id),
    ]);
    if (countRes.error) throw countRes.error;
    if (langRes.error) throw langRes.error;

    const totalAnalyses = countRes.count ?? 0;
    const distinctLanguages = new Set(
      (langRes.data ?? []).map((r) => (r as { language: string }).language),
    ).size;
    return { ok: true, data: { totalAnalyses, distinctLanguages } };
  } catch (e) {
    return dbError(e, "Could not load progress stats.");
  }
}

interface UserProgressRow {
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_on: string | null;
}

function mapProgress(row: UserProgressRow): ProgressState {
  return {
    xp: row.xp,
    level: row.level,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveOn: row.last_active_on,
  };
}
