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

/** Per-user daily execution ceiling — DB-backed because in-memory cannot
 *  enforce cross-instance daily caps on serverless. Resets at UTC midnight. */
export const EXECUTE_DAILY_QUOTA = 100;
