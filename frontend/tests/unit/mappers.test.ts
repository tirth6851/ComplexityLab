import { describe, expect, it } from "vitest";
import {
  mapAnalysis,
  mapAnalysisDetail,
  mapProfile,
  mapSnippet,
  type AnalysisRow,
  type ProfileRow,
  type SnippetRow,
} from "@/lib/db/mappers";

describe("db row mappers", () => {
  it("maps a profile row to the domain shape", () => {
    const row: ProfileRow = {
      id: "p-1",
      clerk_user_id: "user_abc",
      display_name: "Ada",
      preferred_language: "python",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-02T00:00:00Z",
    };
    expect(mapProfile(row)).toEqual({
      id: "p-1",
      clerkUserId: "user_abc",
      displayName: "Ada",
      preferredLanguage: "python",
      createdAt: "2026-06-01T00:00:00Z",
    });
  });

  it("maps an analysis row to the domain shape", () => {
    const row: AnalysisRow = {
      id: "a-1",
      profile_id: "p-1",
      title: "quickSort()",
      language: "typescript",
      code: "function quickSort() {}",
      time_complexity: "O(n log n)",
      space_complexity: "O(log n)",
      verdict: "Solid.",
      result: { anything: true },
      created_at: "2026-06-08T10:00:00Z",
    };
    expect(mapAnalysis(row)).toEqual({
      id: "a-1",
      title: "quickSort()",
      language: "typescript",
      timeComplexity: "O(n log n)",
      spaceComplexity: "O(log n)",
      verdict: "Solid.",
      createdAt: "2026-06-08T10:00:00Z",
    });
  });

  it("maps an analysis row to the detail shape including code and result", () => {
    const fakeResult = { time: { notation: "O(n)", tier: "fair" }, space: { notation: "O(1)", tier: "optimal" }, verdict: "Linear.", notes: [], metrics: [], confidence: 0.9, provider: "mock" };
    const row: AnalysisRow = {
      id: "a-2",
      profile_id: "p-1",
      title: "linearSearch()",
      language: "python",
      code: "def search(arr, x): ...",
      time_complexity: "O(n)",
      space_complexity: "O(1)",
      verdict: "Linear.",
      result: fakeResult,
      created_at: "2026-06-10T08:00:00Z",
    };
    const detail = mapAnalysisDetail(row);
    expect(detail.id).toBe("a-2");
    expect(detail.code).toBe("def search(arr, x): ...");
    expect(detail.result).toBe(fakeResult);
    expect(detail.timeComplexity).toBe("O(n)");
  });

  it("sets result to null when the stored value is null", () => {
    const row: AnalysisRow = {
      id: "a-3",
      profile_id: "p-1",
      title: "old()",
      language: "javascript",
      code: "function old() {}",
      time_complexity: "O(1)",
      space_complexity: "O(1)",
      verdict: "Constant.",
      result: null,
      created_at: "2026-06-10T09:00:00Z",
    };
    expect(mapAnalysisDetail(row).result).toBeNull();
  });

  it("maps a snippet row and defaults missing tags to []", () => {
    const row: SnippetRow = {
      id: "s-1",
      profile_id: "p-1",
      title: "Memoized fib",
      language: "javascript",
      code: "function fib() {}",
      tags: null as unknown as string[],
      created_at: "2026-06-07T09:00:00Z",
    };
    const mapped = mapSnippet(row);
    expect(mapped.tags).toEqual([]);
    expect(mapped.savedAt).toBe("2026-06-07T09:00:00Z");
  });
});
