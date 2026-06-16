/**
 * Integration tests for delete Server Actions.
 *
 * Covers deleteAnalysisAction, deleteAnalysisAndRedirectAction, deleteSnippetAction —
 * the three destructive paths that were previously untested (P1-6 gap).
 *
 * Asserts: rate-limit guard fires first, id validation rejects empty values,
 * DB failures surface to the caller, and revalidatePath/redirect are called on
 * success. The DB layer itself is mocked so tests are network-free.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// ── Module mocks (hoisted by Vitest before any import) ────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/action-limit", () => ({
  checkActionLimit: vi.fn(),
}));

vi.mock("@/lib/db/analyses", () => ({
  deleteAnalysis: vi.fn(),
}));

vi.mock("@/lib/db/snippets", () => ({
  deleteSnippet: vi.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkActionLimit } from "@/lib/action-limit";
import { deleteAnalysis } from "@/lib/db/analyses";
import { deleteSnippet } from "@/lib/db/snippets";
import { deleteAnalysisAction } from "@/app/(app)/analyses/actions";
import { deleteAnalysisAndRedirectAction } from "@/app/(app)/analyses/[id]/actions";
import { deleteSnippetAction } from "@/app/(app)/snippets/actions";

// ── Setup ─────────────────────────────────────────────────────────────────────

const mockedCheckActionLimit = checkActionLimit as Mock;
const mockedDeleteAnalysis = deleteAnalysis as Mock;
const mockedDeleteSnippet = deleteSnippet as Mock;
const mockedRevalidatePath = revalidatePath as Mock;
const mockedRedirect = redirect as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: not rate-limited, not signed out.
  mockedCheckActionLimit.mockResolvedValue(null);
});

// ════════════════════════════════════════════════════════════════════════════
// deleteAnalysisAction
// ════════════════════════════════════════════════════════════════════════════

describe("deleteAnalysisAction", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await deleteAnalysisAction("");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/missing analysis id/i);
    expect(mockedDeleteAnalysis).not.toHaveBeenCalled();
  });

  it("returns the rate-limit error without touching the database", async () => {
    mockedCheckActionLimit.mockResolvedValue(
      "Slow down — too many requests. Try again in 5s.",
    );

    const result = await deleteAnalysisAction("analysis-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/slow down/i);
    expect(mockedDeleteAnalysis).not.toHaveBeenCalled();
  });

  it("deletes the analysis and revalidates the affected routes on success", async () => {
    mockedDeleteAnalysis.mockResolvedValue({ ok: true, data: null });

    const result = await deleteAnalysisAction("analysis-1");

    expect(result.ok).toBe(true);
    expect(mockedDeleteAnalysis).toHaveBeenCalledWith("analysis-1");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/analyses");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("surfaces a database failure to the caller without revalidating", async () => {
    mockedDeleteAnalysis.mockResolvedValue({
      ok: false,
      error: "Could not delete the analysis.",
    });

    const result = await deleteAnalysisAction("analysis-1");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Could not delete the analysis.");
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// deleteAnalysisAndRedirectAction (detail page delete)
// ════════════════════════════════════════════════════════════════════════════

describe("deleteAnalysisAndRedirectAction", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await deleteAnalysisAndRedirectAction("");

    expect(result).toMatchObject({ ok: false });
    expect(result.error).toMatch(/missing analysis id/i);
    expect(mockedDeleteAnalysis).not.toHaveBeenCalled();
  });

  it("returns the rate-limit error without touching the database", async () => {
    mockedCheckActionLimit.mockResolvedValue(
      "Slow down — too many requests. Try again in 5s.",
    );

    const result = await deleteAnalysisAndRedirectAction("analysis-1");

    expect(result).toMatchObject({ ok: false });
    expect(mockedDeleteAnalysis).not.toHaveBeenCalled();
  });

  it("deletes the analysis, revalidates routes, and redirects to /analyses", async () => {
    mockedDeleteAnalysis.mockResolvedValue({ ok: true, data: null });

    await deleteAnalysisAndRedirectAction("analysis-1");

    expect(mockedDeleteAnalysis).toHaveBeenCalledWith("analysis-1");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/analyses");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockedRedirect).toHaveBeenCalledWith("/analyses");
  });

  it("surfaces a database failure before redirecting", async () => {
    mockedDeleteAnalysis.mockResolvedValue({
      ok: false,
      error: "Could not delete the analysis.",
    });

    const result = await deleteAnalysisAndRedirectAction("analysis-1");

    expect(result).toMatchObject({ ok: false, error: "Could not delete the analysis." });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// deleteSnippetAction
// ════════════════════════════════════════════════════════════════════════════

describe("deleteSnippetAction", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await deleteSnippetAction("");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/missing snippet id/i);
    expect(mockedDeleteSnippet).not.toHaveBeenCalled();
  });

  it("returns the rate-limit error without touching the database", async () => {
    mockedCheckActionLimit.mockResolvedValue(
      "Slow down — too many requests. Try again in 5s.",
    );

    const result = await deleteSnippetAction("snippet-1");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/slow down/i);
    expect(mockedDeleteSnippet).not.toHaveBeenCalled();
  });

  it("deletes the snippet and revalidates the affected routes on success", async () => {
    mockedDeleteSnippet.mockResolvedValue({ ok: true, data: null });

    const result = await deleteSnippetAction("snippet-1");

    expect(result.ok).toBe(true);
    expect(mockedDeleteSnippet).toHaveBeenCalledWith("snippet-1");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/snippets");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("surfaces a database failure to the caller without revalidating", async () => {
    mockedDeleteSnippet.mockResolvedValue({
      ok: false,
      error: "Could not delete the snippet.",
    });

    const result = await deleteSnippetAction("snippet-1");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Could not delete the snippet.");
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});
