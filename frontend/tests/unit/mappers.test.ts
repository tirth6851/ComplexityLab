import { describe, expect, it } from "vitest";
import {
  mapAnalysis,
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
