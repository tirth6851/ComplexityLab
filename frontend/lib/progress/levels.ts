/**
 * XP → level formulas (pure, no server-only import — safe in tests and client code).
 *
 * xpForLevel(L) = 50 · L · (L − 1)   — cumulative XP to reach level L (L ≥ 1 → 0, 100, 300, 600, …)
 * levelFromXp(x) = floor((1 + sqrt(1 + x/12.5)) / 2)   — inverse; clamped ≥ 1
 *
 * Both MUST mirror `public.level_from_xp` in the Supabase migration exactly.
 * A parity unit test sweeps both to confirm they agree.
 *
 * WHY duplicate the formula in both TypeScript and SQL? The DB function lets
 * Supabase queries compute the level without a round-trip to the app server.
 * The TS version lets the UI compute level/progress client-side from cached XP.
 * They must stay in sync — if you change one, change the other and update the test.
 */

export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2));
}

export interface LevelProgress {
  level: number;
  /** XP earned within the current level. */
  into: number;
  /** Total XP span of the current level. */
  span: number;
  /** Completion fraction 0–1. */
  fraction: number;
}

export function progressToNextLevel(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const into = xp - currentFloor;
  const span = nextFloor - currentFloor;
  const fraction = span > 0 ? Math.min(1, into / span) : 1;
  return { level, into, span, fraction };
}
