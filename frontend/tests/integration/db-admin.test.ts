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
  it("extracts messages from Error instances", () => {
    const res = dbError<null>(new Error("boom"), "fallback");
    expect(res).toEqual({ ok: false, error: "boom" });
  });

  it("falls back for unknown error shapes", () => {
    const res = dbError<null>({ weird: true }, "fallback message");
    expect(res).toEqual({ ok: false, error: "fallback message" });
  });
});
