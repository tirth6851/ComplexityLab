import { afterEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

const OPTS = { limit: 3, windowMs: 1000 };
const T0 = 1_000_000;

afterEach(() => {
  resetRateLimits();
});

describe("rateLimit", () => {
  it("allows hits up to the limit and reports remaining", () => {
    expect(rateLimit("k", OPTS, T0)).toEqual({
      ok: true,
      remaining: 2,
      retryAfterMs: 0,
    });
    expect(rateLimit("k", OPTS, T0 + 10).remaining).toBe(1);
    expect(rateLimit("k", OPTS, T0 + 20).remaining).toBe(0);
  });

  it("rejects the hit past the limit with a retry estimate", () => {
    rateLimit("k", OPTS, T0);
    rateLimit("k", OPTS, T0 + 10);
    rateLimit("k", OPTS, T0 + 20);
    const rejected = rateLimit("k", OPTS, T0 + 30);
    expect(rejected.ok).toBe(false);
    expect(rejected.retryAfterMs).toBe(970); // oldest hit (T0) + 1000 - now
  });

  it("frees capacity as the window slides", () => {
    rateLimit("k", OPTS, T0);
    rateLimit("k", OPTS, T0 + 10);
    rateLimit("k", OPTS, T0 + 20);
    // T0 hit expired; one slot opens.
    const later = rateLimit("k", OPTS, T0 + 1001);
    expect(later.ok).toBe(true);
  });

  it("tracks keys independently", () => {
    rateLimit("a", OPTS, T0);
    rateLimit("a", OPTS, T0);
    rateLimit("a", OPTS, T0);
    expect(rateLimit("a", OPTS, T0).ok).toBe(false);
    expect(rateLimit("b", OPTS, T0).ok).toBe(true);
  });
});
