/**
 * Ownership-scoping integration tests — multi-tenant security boundary.
 *
 * SEC-02/03 (cross-account isolation), P1-6 (missing automated guard).
 *
 * Every read, write, and delete in lib/db/analyses and lib/db/snippets MUST be
 * scoped to the signed-in user's profile via profile_id. These tests assert:
 *   • List queries filter by profile_id
 *   • Single-row reads filter by BOTH id AND profile_id (IDOR prevention)
 *   • PGRST116 from a profile-scoped query returns generic not-found — not a
 *     signal that the row exists under a different owner
 *   • Inserts always set profile_id from the server-resolved profile, never a
 *     caller-supplied value
 *   • Deletes filter by BOTH id AND profile_id — cross-account row cannot match
 */

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import type { CodeAnalysis } from "@/lib/ai/types";

// ── Module mocks (Vitest hoists vi.mock calls before any import) ─────────────

vi.mock("@/lib/db/profiles", () => ({
  getOrCreateProfile: vi.fn(),
}));

vi.mock("@/lib/db/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/admin")>();
  return {
    ...actual, // preserves isDbConfigured, DbResult, dbError (real implementations)
    getAdminClient: vi.fn(),
  };
});

// ── Imports (resolved after mocks are registered) ────────────────────────────

import { getOrCreateProfile } from "@/lib/db/profiles";
import { getAdminClient } from "@/lib/db/admin";
import {
  listAnalyses,
  getAnalysis,
  createAnalysis,
  deleteAnalysis,
} from "@/lib/db/analyses";
import { listSnippets, createSnippet, deleteSnippet } from "@/lib/db/snippets";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PROFILE_ID = "profile-user-a-uuid";

const fakeProfile: Profile = {
  id: PROFILE_ID,
  clerkUserId: "clerk_user_a",
  displayName: "User A",
  preferredLanguage: "typescript",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const fakeAnalysisRow = {
  id: "analysis-1",
  profile_id: PROFILE_ID,
  title: "bubbleSort()",
  language: "typescript",
  code: "function bubbleSort(arr: number[]) {}",
  time_complexity: "O(n²)",
  space_complexity: "O(1)",
  verdict: "Quadratic time.",
  result: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

const fakeSnippetRow = {
  id: "snippet-1",
  profile_id: PROFILE_ID,
  title: "identity()",
  language: "typescript",
  code: "const identity = (x: unknown) => x;",
  tags: [],
  created_at: "2026-01-01T00:00:00.000Z",
};

const fakeAnalysis: CodeAnalysis = {
  time: { notation: "O(n²)", tier: "poor", reason: "Nested loops." },
  space: { notation: "O(1)", tier: "optimal", reason: "No extra allocation." },
  verdict: "Quadratic time, constant space.",
  notes: ["Two nested for-loops detected."],
  metrics: [],
  confidence: 0.9,
  provider: "mock",
};

// ── Spy builder factory ───────────────────────────────────────────────────────

interface BuilderSpy {
  /** Cast as SupabaseClient for use with mockedGetAdminClient.mockReturnValue(). */
  db: SupabaseClient;
  /** All [column, value] pairs passed to .eq() during the query chain. */
  eqFilters: [string, unknown][];
  /** Payload passed to the first .insert() or .update() call (accessed post-await). */
  readonly capturedInsert: unknown;
}

/**
 * Returns a thenable Supabase-builder mock. Every chainable method returns the
 * same object so the fluent chain stays intact. When the chain is `await`ed it
 * resolves to `result`, matching how Supabase PostgREST-js works.
 *
 * Captures:
 *   • `eqFilters` — every .eq(col, val) call (array, mutated in place, safe to
 *     destructure before the `await`)
 *   • `capturedInsert` — the first .insert()/.update() payload (getter — access
 *     via `spy.capturedInsert` AFTER the async call completes)
 */
function makeBuilder(result: {
  data?: unknown;
  error?: unknown;
}): BuilderSpy {
  const eqFilters: [string, unknown][] = [];
  let _capturedInsert: unknown = null;

  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const base = Promise.resolve(resolved);

  const db: Record<string, unknown> = {};
  db.from        = vi.fn(() => db);
  db.select      = vi.fn(() => db);
  db.insert      = vi.fn((data: unknown) => { _capturedInsert = data; return db; });
  db.delete      = vi.fn(() => db);
  db.update      = vi.fn((data: unknown) => { _capturedInsert = data; return db; });
  db.eq          = vi.fn((col: string, val: unknown) => { eqFilters.push([col, val]); return db; });
  db.order       = vi.fn(() => db);
  db.limit       = vi.fn(() => db);
  db.single      = vi.fn(() => db);
  db.maybeSingle = vi.fn(() => db);
  // Thenable: `await db` (or any returning-db method) resolves to `resolved`.
  db.then        = base.then.bind(base);
  db.catch       = base.catch.bind(base);
  db.finally     = base.finally.bind(base);

  return {
    db: db as unknown as SupabaseClient,
    eqFilters,
    get capturedInsert() { return _capturedInsert; },
  };
}

// ── Setup ────────────────────────────────────────────────────────────────────

const mockedGetOrCreateProfile = getOrCreateProfile as Mock;
const mockedGetAdminClient = getAdminClient as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: signed-in as User A with a known profile id.
  mockedGetOrCreateProfile.mockResolvedValue({ ok: true, data: fakeProfile });
});

// ════════════════════════════════════════════════════════════════════════════
// ANALYSES
// ════════════════════════════════════════════════════════════════════════════

describe("listAnalyses — ownership scoping", () => {
  it("applies a profile_id filter scoped to the signed-in user", async () => {
    const spy = makeBuilder({ data: [fakeAnalysisRow] });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await listAnalyses();

    expect(result.ok).toBe(true);
    expect(spy.eqFilters).toContainEqual(["profile_id", PROFILE_ID]);
  });

  it("returns the profile error immediately and never calls getAdminClient", async () => {
    mockedGetOrCreateProfile.mockResolvedValue({
      ok: false,
      error: "Not signed in.",
    });

    const result = await listAnalyses();

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: "Not signed in." });
    expect(mockedGetAdminClient).not.toHaveBeenCalled();
  });
});

describe("getAnalysis — ownership scoping (SEC-02/03)", () => {
  it("filters by BOTH the analysis id and the current user's profile_id", async () => {
    const spy = makeBuilder({ data: fakeAnalysisRow });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await getAnalysis("analysis-1");

    expect(result.ok).toBe(true);
    expect(spy.eqFilters).toContainEqual(["id", "analysis-1"]);
    expect(spy.eqFilters).toContainEqual(["profile_id", PROFILE_ID]);
  });

  it("returns not-found on PGRST116 — simulates reading another user's analysis", async () => {
    // When User A requests an analysis that belongs to User B:
    // • The query includes .eq("profile_id", userA-profile-id)
    // • User B's row is excluded → PostgREST returns PGRST116
    // • getAnalysis must return a generic "not found" — NOT a different error
    //   shape that would signal the row exists under a different owner (IDOR oracle).
    const spy = makeBuilder({
      data: null,
      error: {
        code: "PGRST116",
        message: "JSON object requested, multiple (or no) rows returned",
      },
    });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await getAnalysis("analysis-from-other-user");

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: "Analysis not found." });
    // Confirm the profile_id scope was still applied (not bypassed)
    expect(spy.eqFilters).toContainEqual(["profile_id", PROFILE_ID]);
  });
});

describe("createAnalysis — ownership scoping", () => {
  it("always sets profile_id from the server-resolved profile, not a caller value", async () => {
    const spy = makeBuilder({ data: fakeAnalysisRow });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await createAnalysis({
      title: "bubbleSort()",
      language: "typescript",
      code: "function bubbleSort(arr: number[]) {}",
      analysis: fakeAnalysis,
    });

    expect(result.ok).toBe(true);
    // profile_id in the INSERT comes from getOrCreateProfile(), not from the
    // caller — there is no profile_id field on the NewAnalysis input shape.
    expect(spy.capturedInsert).toMatchObject({ profile_id: PROFILE_ID });
  });
});

describe("deleteAnalysis — ownership scoping (SEC-02/03)", () => {
  it("filters the DELETE by BOTH the analysis id and the current user's profile_id", async () => {
    const spy = makeBuilder({ data: null });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await deleteAnalysis("analysis-1");

    expect(result.ok).toBe(true);
    expect(spy.eqFilters).toContainEqual(["id", "analysis-1"]);
    expect(spy.eqFilters).toContainEqual(["profile_id", PROFILE_ID]);
  });

  it("profile_id filter is always the resolved user's id — not another user's", async () => {
    // User A is signed in (PROFILE_ID). They send a request to delete
    // "analysis-user-b-id" which belongs to User B.
    // The DELETE includes .eq("profile_id", PROFILE_ID), so the DB finds
    // no matching row and silently no-ops. We assert the filter is always present.
    const spy = makeBuilder({ data: null });
    mockedGetAdminClient.mockReturnValue(spy.db);

    await deleteAnalysis("analysis-user-b-id");

    const profileIdFilter = spy.eqFilters.find(([col]) => col === "profile_id");
    expect(profileIdFilter).toBeDefined();
    expect(profileIdFilter![1]).toBe(PROFILE_ID);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SNIPPETS
// ════════════════════════════════════════════════════════════════════════════

describe("listSnippets — ownership scoping", () => {
  it("applies a profile_id filter scoped to the signed-in user", async () => {
    const spy = makeBuilder({ data: [fakeSnippetRow] });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await listSnippets();

    expect(result.ok).toBe(true);
    expect(spy.eqFilters).toContainEqual(["profile_id", PROFILE_ID]);
  });
});

describe("createSnippet — ownership scoping", () => {
  it("always sets profile_id from the server-resolved profile", async () => {
    const spy = makeBuilder({ data: fakeSnippetRow });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await createSnippet({
      title: "identity()",
      language: "typescript",
      code: "const identity = (x: unknown) => x;",
      tags: [],
    });

    expect(result.ok).toBe(true);
    expect(spy.capturedInsert).toMatchObject({ profile_id: PROFILE_ID });
  });
});

describe("deleteSnippet — ownership scoping", () => {
  it("filters the DELETE by BOTH the snippet id and the current user's profile_id", async () => {
    const spy = makeBuilder({ data: null });
    mockedGetAdminClient.mockReturnValue(spy.db);

    const result = await deleteSnippet("snippet-1");

    expect(result.ok).toBe(true);
    expect(spy.eqFilters).toContainEqual(["id", "snippet-1"]);
    expect(spy.eqFilters).toContainEqual(["profile_id", PROFILE_ID]);
  });
});
