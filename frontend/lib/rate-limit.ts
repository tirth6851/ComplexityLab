/**
 * Sliding-window rate limiter, in-memory.
 *
 * Scope note: state lives in the serverless function's memory, so limits are
 * enforced per warm instance, not globally across all Vercel instances. This
 * still stops sudden bursts from a single client (the common abuse pattern),
 * but a determined user with multiple clients could hit N instances in parallel.
 *
 * For strict global enforcement (e.g. paid-tier quotas), move the window to a
 * shared store (Upstash Redis / Vercel KV) behind this same function signature
 * — all call sites pass through here, so nothing else would need to change.
 *
 * Judge0 daily quotas (lib/db/executions.ts) use DB-backed counts precisely
 * because in-memory cannot enforce cross-instance daily caps.
 */

export interface RateLimitOptions {
  /** Max allowed hits within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Hits left in the current window (0 when rejected). */
  remaining: number;
  /** How long until the oldest hit expires (ms); 0 when allowed. */
  retryAfterMs: number;
}

const buckets = new Map<string, number[]>();

/** Safety valve so a flood of unique keys can't grow memory unbounded. */
const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  let hits = buckets.get(key);
  if (!hits) {
    hits = [];
    buckets.set(key, hits);
    if (buckets.size > MAX_KEYS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined && oldest !== key) buckets.delete(oldest);
    }
  }

  const cutoff = now - windowMs;
  while (hits.length > 0 && hits[0] <= cutoff) hits.shift();

  if (hits.length >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, hits[0] + windowMs - now),
    };
  }

  hits.push(now);
  return { ok: true, remaining: limit - hits.length, retryAfterMs: 0 };
}

/** Test helper: drop all windows. */
export function resetRateLimits(): void {
  buckets.clear();
}
