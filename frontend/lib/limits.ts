/**
 * Shared application limits — single source of truth for values that appear
 * in both the API route and server actions so they never drift apart.
 */

/** Hard cap on submitted / saved source size (chars). */
export const MAX_CODE_LENGTH = 100_000;

/** Hard cap on code submitted to the online compiler (chars). Smaller than
 *  the analysis cap — execution has higher resource cost than static analysis. */
export const MAX_EXEC_CODE_LENGTH = 20_000;

/** Hard cap on stdin submitted to the online compiler (chars). */
export const MAX_EXEC_STDIN_LENGTH = 4_000;

/** DB column cap for derived titles. */
export const TITLE_MAX_LENGTH = 200;

/** Per-user analysis budget (API route). */
export const ANALYZE_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

/** Per-user save budget (server actions). */
export const SAVE_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

/** Per-user delete budget (server actions). */
export const DELETE_RATE_LIMIT = { limit: 60, windowMs: 60_000 } as const;

/** Per-user execution burst (in-memory, per warm instance). */
export const EXECUTE_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

/**
 * Per-user daily execution ceiling — DB-backed because in-memory cannot
 * enforce cross-instance daily caps on serverless. Resets at UTC midnight.
 * Override with JUDGE0_USER_DAILY_QUOTA env var (positive integer).
 * Falls back to 100 if the env var is absent, empty, or non-numeric.
 */
const _rawUserQuota = parseInt(process.env.JUDGE0_USER_DAILY_QUOTA ?? "", 10);
export const EXECUTE_DAILY_QUOTA =
  Number.isFinite(_rawUserQuota) && _rawUserQuota > 0 ? _rawUserQuota : 100;

/**
 * Default global daily hard cap for Judge0 submissions across ALL users.
 * This is a reference constant; the route reads JUDGE0_GLOBAL_DAILY_CAP
 * at request time so it can be toggled without redeployment.
 *
 * 900 = safety buffer below ~$1 in paid overage (RapidAPI charges ~$0.001/submission
 * after 500 free daily requests). Leaves a 100-submission buffer to absorb TOCTOU
 * race windows across concurrent serverless invocations.
 * Only enforced when JUDGE0_GLOBAL_DAILY_CAP is explicitly set in env.
 */
export const JUDGE0_GLOBAL_DAILY_CAP_DEFAULT = 900;

/** Hard cap on a single chat message (chars). */
export const MAX_CHAT_MESSAGE_LENGTH = 4_000;

/** Number of past messages loaded as context per chat request. */
export const CHAT_HISTORY_LIMIT = 12;

/** Per-user chat burst (in-memory, per warm instance). */
export const CHAT_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

/** Per-user daily chat ceiling — DB-backed, counts user turns only.
 *  Resets at UTC midnight. Token counts are analytics; this is the gate. */
export const CHAT_DAILY_QUOTA = 50;
