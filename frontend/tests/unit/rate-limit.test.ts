import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rateLimit,
  rateLimitMemory,
  resetRateLimits,
} from "@/lib/rate-limit";

const OPTS = { limit: 3, windowMs: 1000 };
const T0 = 1_000_000;

afterEach(() => {
  resetRateLimits();
});

describe("rateLimitMemory", () => {
  it("allows hits up to the limit and reports remaining", () => {
    expect(rateLimitMemory("k", OPTS, T0)).toEqual({
      ok: true,
      remaining: 2,
      retryAfterMs: 0,
    });
    expect(rateLimitMemory("k", OPTS, T0 + 10).remaining).toBe(1);
    expect(rateLimitMemory("k", OPTS, T0 + 20).remaining).toBe(0);
  });

  it("rejects the hit past the limit with a retry estimate", () => {
    rateLimitMemory("k", OPTS, T0);
    rateLimitMemory("k", OPTS, T0 + 10);
    rateLimitMemory("k", OPTS, T0 + 20);
    const rejected = rateLimitMemory("k", OPTS, T0 + 30);
    expect(rejected.ok).toBe(false);
    expect(rejected.retryAfterMs).toBe(970); // oldest hit (T0) + 1000 - now
  });

  it("frees capacity as the window slides", () => {
    rateLimitMemory("k", OPTS, T0);
    rateLimitMemory("k", OPTS, T0 + 10);
    rateLimitMemory("k", OPTS, T0 + 20);
    // T0 hit expired; one slot opens.
    const later = rateLimitMemory("k", OPTS, T0 + 1001);
    expect(later.ok).toBe(true);
  });

  it("tracks keys independently", () => {
    rateLimitMemory("a", OPTS, T0);
    rateLimitMemory("a", OPTS, T0);
    rateLimitMemory("a", OPTS, T0);
    expect(rateLimitMemory("a", OPTS, T0).ok).toBe(false);
    expect(rateLimitMemory("b", OPTS, T0).ok).toBe(true);
  });
});

describe("rateLimit (Upstash not configured)", () => {
  it("falls through to the in-memory limiter", async () => {
    expect(await rateLimit("k", OPTS, T0)).toEqual({
      ok: true,
      remaining: 2,
      retryAfterMs: 0,
    });
  });
});

describe("rateLimit (Upstash configured)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function freshRateLimit() {
    // Upstash URL/token are read at module load time, so re-import after
    // stubbing env vars.
    const mod = await import("@/lib/rate-limit");
    return mod.rateLimit;
  }

  it("allows a hit under the limit via the Redis pipeline", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 0 }, { result: 1 }, { result: null }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 1 }, { result: 1 }],
      });

    const limited = await freshRateLimit();
    const result = await limited("k", OPTS, T0);

    expect(result).toEqual({ ok: true, remaining: 1, retryAfterMs: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.upstash.io/pipeline",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects once the Redis-reported count reaches the limit", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { result: 0 },
        { result: 3 },
        { result: ["oldest-member", String(T0)] },
      ],
    });

    const limited = await freshRateLimit();
    const result = await limited("k", OPTS, T0 + 30);

    expect(result).toEqual({ ok: false, remaining: 0, retryAfterMs: 970 });
    expect(fetchMock).toHaveBeenCalledTimes(1); // no write call once rejected
  });

  it("fails open to the in-memory limiter when Redis errors", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    const limited = await freshRateLimit();
    const result = await limited("k", OPTS, T0);

    expect(result).toEqual({ ok: true, remaining: 2, retryAfterMs: 0 });
  });

  it("fails open to the in-memory limiter when Redis throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const limited = await freshRateLimit();
    const result = await limited("k", OPTS, T0);

    expect(result).toEqual({ ok: true, remaining: 2, retryAfterMs: 0 });
  });
});
