import { afterEach, describe, expect, it, vi } from "vitest";
import { dbError, getAdminClient, isDbConfigured } from "@/lib/db/admin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDbConfigured", () => {
  it("requires both the URL and the service-role key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(isDbConfigured()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    expect(isDbConfigured()).toBe(false);

    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");
    expect(isDbConfigured()).toBe(true);
  });
});

describe("getAdminClient", () => {
  it("throws a clear error when unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => getAdminClient()).toThrow(/not configured/i);
  });
});

describe("dbError", () => {
  it("never leaks the raw provider message to the UI — returns the friendly fallback", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = dbError<null>(
      new Error('relation "public.analyses" does not exist'),
      "Could not load your analyses.",
    );
    // UI sees only the safe fallback…
    expect(res).toEqual({ ok: false, error: "Could not load your analyses." });
    // …but the raw detail is still logged server-side for debugging.
    expect(spy).toHaveBeenCalledWith(
      "[db]",
      'relation "public.analyses" does not exist',
    );
    spy.mockRestore();
  });

  it("returns the fallback for unknown error shapes too", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = dbError<null>({ weird: true }, "fallback message");
    expect(res).toEqual({ ok: false, error: "fallback message" });
    spy.mockRestore();
  });
});
