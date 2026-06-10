import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// The action rate-limit guard resolves the user via Clerk.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_test_actions" })),
}));

vi.mock("@/lib/db/analyses", () => ({
  createAnalysis: vi.fn(),
}));

vi.mock("@/lib/db/snippets", () => ({
  createSnippet: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { createAnalysis } from "@/lib/db/analyses";
import { createSnippet } from "@/lib/db/snippets";
import {
  saveAnalysisAction,
  saveSnippetAction,
} from "@/app/(app)/analyzer/actions";
import { analyzeCode } from "@/lib/analysis/engine";

const code = `function binarySearch(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;
const analysis = analyzeCode({ code, language: "javascript" });

describe("saveAnalysisAction", () => {
  beforeEach(() => {
    vi.mocked(createAnalysis).mockReset();
    vi.mocked(revalidatePath).mockReset();
  });

  it("rejects an empty buffer without touching the database", async () => {
    const res = await saveAnalysisAction({ code: " ", language: "javascript", analysis });
    expect(res.ok).toBe(false);
    expect(createAnalysis).not.toHaveBeenCalled();
  });

  it("rejects unsupported languages", async () => {
    const res = await saveAnalysisAction({ code, language: "cobol", analysis });
    expect(res.ok).toBe(false);
    expect(createAnalysis).not.toHaveBeenCalled();
  });

  it("rejects incomplete analysis payloads", async () => {
    const res = await saveAnalysisAction({
      code,
      language: "javascript",
      analysis: {} as never,
    });
    expect(res.ok).toBe(false);
    expect(createAnalysis).not.toHaveBeenCalled();
  });

  it("persists with a derived title and revalidates affected routes", async () => {
    vi.mocked(createAnalysis).mockResolvedValue({
      ok: true,
      data: {
        id: "a1",
        title: "binarySearch()",
        language: "javascript",
        timeComplexity: analysis.time.notation,
        spaceComplexity: analysis.space.notation,
        verdict: analysis.verdict,
        createdAt: new Date().toISOString(),
      },
    });

    const res = await saveAnalysisAction({ code, language: "javascript", analysis });
    expect(res.ok).toBe(true);
    expect(createAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "binarySearch()",
        language: "javascript",
        code,
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/analyses");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("surfaces database failures", async () => {
    vi.mocked(createAnalysis).mockResolvedValue({
      ok: false,
      error: "Database not configured.",
    });
    const res = await saveAnalysisAction({ code, language: "javascript", analysis });
    expect(res).toEqual({ ok: false, error: "Database not configured." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("saveSnippetAction", () => {
  beforeEach(() => {
    vi.mocked(createSnippet).mockReset();
    vi.mocked(revalidatePath).mockReset();
  });

  it("persists a snippet with a derived title", async () => {
    vi.mocked(createSnippet).mockResolvedValue({
      ok: true,
      data: {
        id: "s1",
        title: "binarySearch()",
        language: "javascript",
        tags: [],
        savedAt: new Date().toISOString(),
      },
    });

    const res = await saveSnippetAction({ code, language: "javascript" });
    expect(res.ok).toBe(true);
    expect(createSnippet).toHaveBeenCalledWith(
      expect.objectContaining({ title: "binarySearch()" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/snippets");
  });

  it("rejects an empty buffer", async () => {
    const res = await saveSnippetAction({ code: "", language: "javascript" });
    expect(res.ok).toBe(false);
    expect(createSnippet).not.toHaveBeenCalled();
  });
});
