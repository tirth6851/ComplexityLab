import "server-only";

import { dbError, getAdminClient, type DbResult } from "./admin";
import { getOrCreateProfile } from "./profiles";

export interface ExecutionRecord {
  language: string;
  status:   string;
  timeMs:   number | null;
  memoryKb: number | null;
}

/**
 * Counts how many executions the signed-in user has run today (UTC).
 * Used for the per-day quota gate in /api/execute.
 *
 * Returns { ok: false } on any DB error — the route degrades gracefully
 * (allows the execution rather than blocking on a transient DB issue).
 */
export async function countExecutionsToday(): Promise<DbResult<number>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();

    // Midnight of the current UTC day
    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);

    const res = await db
      .from("code_executions")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.data.id)
      .gte("created_at", startOfDayUtc.toISOString());

    if (res.error) throw res.error;
    return { ok: true, data: res.count ?? 0 };
  } catch (e) {
    return dbError(e, "Could not check execution quota.");
  }
}

/**
 * Counts all code executions run today (UTC) across every user.
 * Used for the global cost-protection cap in /api/execute.
 *
 * No profile_id filter — counts all submissions globally so the route can
 * enforce a billing-period hard cap across all users.
 *
 * Returns { ok: false } on any DB error — the route logs and degrades
 * gracefully when the DB is unavailable or the migration is not yet applied.
 */
export async function countAllExecutionsToday(): Promise<DbResult<number>> {
  try {
    const db = getAdminClient();

    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);

    const res = await db
      .from("code_executions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDayUtc.toISOString());

    if (res.error) throw res.error;
    return { ok: true, data: res.count ?? 0 };
  } catch (e) {
    return dbError(e, "Could not check global execution quota.");
  }
}

/**
 * Persists execution metadata after a run. Stores only metadata — code,
 * stdin, stdout, and stderr are NEVER recorded here (privacy parity with
 * the analyses table).
 *
 * Best-effort: a failure here is logged but must never fail the API response.
 */
export async function recordExecution(
  record: ExecutionRecord,
): Promise<DbResult<null>> {
  const profile = await getOrCreateProfile();
  if (!profile.ok) return profile;

  try {
    const db = getAdminClient();
    const res = await db.from("code_executions").insert({
      profile_id: profile.data.id,
      language:   record.language,
      status:     record.status,
      time_ms:    record.timeMs,
      memory_kb:  record.memoryKb,
    });
    if (res.error) throw res.error;
    return { ok: true, data: null };
  } catch (e) {
    return dbError(e, "Could not record execution.");
  }
}
