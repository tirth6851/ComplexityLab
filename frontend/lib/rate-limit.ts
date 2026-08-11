/**
 * Sliding-window rate limiter. Two backends behind one async signature:
 *
 * - **Redis (Upstash REST API)** when `UPSTASH_REDIS_REST_URL` +
 *   `UPSTASH_REDIS_REST_TOKEN` are set — shared across every serverless
 *   instance, so a burst can't dodge the limit by landing on a fresh
 *   instance. No SDK dependency: Upstash's REST `/pipeline` endpoint is a
 *   couple of `fetch()` calls, matching the Groq/Judge0 client pattern
 *   already used in this codebase.
 * - **In-memory `Map`** always, as the zero-config default and as the
 *   fail-open fallback when Redis is unreachable or misconfigured — a rate
 *   limiter outage must never block real traffic.
 *
 * Judge0 daily quotas (lib/db/executions.ts) stay DB-backed regardless —
 * this module only ever governs short-window burst limits.
 */

import { logEvent } from "./log";

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

/** In-memory sliding window. Exported directly for tests and used as the
 * fallback path when Redis isn't configured or a call to it fails. */
export function rateLimitMemory(
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

/** Test helper: drop all in-memory windows. */
export function resetRateLimits(): void {
  buckets.clear();
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Keep the Redis round trip well under a user-perceived delay; any slower
 * than this and the in-memory fallback is the better answer anyway. */
const REDIS_TIMEOUT_MS = 1500;

type UpstashPipelineReply = Array<{ result?: unknown; error?: string }>;

async function upstashPipeline(
  commands: (string | number)[][],
): Promise<UpstashPipelineReply | null> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as UpstashPipelineReply;
    if (!Array.isArray(body) || body.some((r) => r.error)) return null;
    return body;
  } catch {
    return null;
  }
}

/**
 * Redis-backed sliding window using a per-key sorted set (score = hit
 * timestamp). Returns null on any failure so the caller falls back to the
 * in-memory limiter instead of failing the request.
 *
 * Check-then-add (not atomic across the two pipeline calls) admits a small
 * race under concurrent bursts on the same key — acceptable for an abuse
 * guard; anything that must be exact (billing caps) is DB-backed elsewhere.
 */
async function rateLimitRedis(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number,
): Promise<RateLimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  const cutoff = now - windowMs;
  const readReply = await upstashPipeline([
    ["ZREMRANGEBYSCORE", key, "-inf", String(cutoff)],
    ["ZCARD", key],
    ["ZRANGE", key, "0", "0", "WITHSCORES"],
  ]);
  if (!readReply) return null;

  const count = Number(readReply[1]?.result ?? 0);
  if (count >= limit) {
    const oldest = readReply[2]?.result as [string, string] | undefined;
    const oldestScore = oldest?.[1] ? Number(oldest[1]) : now;
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldestScore + windowMs - now),
    };
  }

  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const writeReply = await upstashPipeline([
    ["ZADD", key, String(now), member],
    ["PEXPIRE", key, String(windowMs)],
  ]);
  if (!writeReply) return null;

  return { ok: true, remaining: Math.max(0, limit - count - 1), retryAfterMs: 0 };
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const redisResult = await rateLimitRedis(key, options, now);
    if (redisResult) return redisResult;
    logEvent("rate_limit_redis_fallback", { key });
  }
  return rateLimitMemory(key, options, now);
}
