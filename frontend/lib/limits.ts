/**
 * Shared application limits — single source of truth for values that appear
 * in both the API route and server actions so they never drift apart.
 */

/** Hard cap on submitted / saved source size (chars). */
export const MAX_CODE_LENGTH = 100_000;

/** DB column cap for derived titles. */
export const TITLE_MAX_LENGTH = 200;

/** Per-user analysis budget (API route). */
export const ANALYZE_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

/** Per-user save budget (server actions). */
export const SAVE_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

/** Per-user delete budget (server actions). */
export const DELETE_RATE_LIMIT = { limit: 60, windowMs: 60_000 } as const;
