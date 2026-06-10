import { describe, expect, it } from "vitest";
import {
  computeDashboardStats,
  computeDayStreak,
  computeLanguageMix,
} from "@/lib/stats";
import type { Analysis, Snippet } from "@/types";

const NOW = Date.parse("2026-06-09T12:00:00Z");
const DAY = 86_400_000;

function analysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: Math.random().toString(36).slice(2),
    title: "fn()",
    language: "typescript",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    verdict: "",
    createdAt: new Date(NOW).toISOString(),
    ...overrides,
  };
}

function snippet(overrides: Partial<Snippet>): Snippet {
  return {
    id: Math.random().toString(36).slice(2),
    title: "snippet",
    language: "typescript",
    tags: [],
    savedAt: new Date(NOW).toISOString(),
    ...overrides,
  };
}

describe("computeDayStreak", () => {
  it("returns 0 with no analyses", () => {
    expect(computeDayStreak([], NOW)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const dates = [0, 1, 2].map((d) => new Date(NOW - d * DAY).toISOString());
    expect(computeDayStreak(dates, NOW)).toBe(3);
  });

  it("still counts a streak ending yesterday", () => {
    const dates = [1, 2].map((d) => new Date(NOW - d * DAY).toISOString());
    expect(computeDayStreak(dates, NOW)).toBe(2);
  });

  it("breaks on a gap", () => {
    const dates = [0, 2, 3].map((d) => new Date(NOW - d * DAY).toISOString());
    expect(computeDayStreak(dates, NOW)).toBe(1);
  });

  it("returns 0 when the last activity is older than yesterday", () => {
    const dates = [3, 4].map((d) => new Date(NOW - d * DAY).toISOString());
    expect(computeDayStreak(dates, NOW)).toBe(0);
  });
});

describe("computeDashboardStats", () => {
  it("reports zeroed stats for an empty lab", () => {
    const stats = computeDashboardStats([], [], NOW);
    expect(stats.map((s) => s.value)).toEqual(["0", "0", "0"]);
  });

  it("counts totals, weekly activity, and snippet languages", () => {
    const analyses = [
      analysis({}),
      analysis({ createdAt: new Date(NOW - 2 * DAY).toISOString() }),
      analysis({ createdAt: new Date(NOW - 30 * DAY).toISOString() }),
    ];
    const snippets = [
      snippet({}),
      snippet({ language: "python" }),
    ];
    const [a, s] = computeDashboardStats(analyses, snippets, NOW);
    expect(a.value).toBe("3");
    expect(a.hint).toBe("+2 this week");
    expect(s.value).toBe("2");
    expect(s.hint).toBe("2 languages");
  });
});

describe("computeLanguageMix", () => {
  it("is empty with no analyses", () => {
    expect(computeLanguageMix([])).toEqual([]);
  });

  it("computes percentage share, sorted by frequency, top 4", () => {
    const analyses = [
      ...Array.from({ length: 3 }, () => analysis({ language: "typescript" })),
      analysis({ language: "python" }),
      analysis({ language: "go" }),
      analysis({ language: "rust" }),
      analysis({ language: "java" }),
      analysis({ language: "cpp" }),
    ];
    const mix = computeLanguageMix(analyses);
    expect(mix).toHaveLength(4);
    expect(mix[0]).toEqual({ label: "typescript", value: 38 }); // 3/8
    expect(mix.every((m) => m.value > 0 && m.value <= 100)).toBe(true);
  });
});
