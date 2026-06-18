import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/progress", () => ({
  listUnlockedAchievements: vi.fn(),
}));

import { evaluateNewAchievements } from "@/lib/progress/evaluate";
import { listUnlockedAchievements } from "@/lib/db/progress";
import type { ProgressState, ProgressStats } from "@/types";

const baseProgress: ProgressState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveOn: null,
};
const baseStats: ProgressStats = { totalAnalyses: 0, distinctLanguages: 0 };

function mockUnlocked(...keys: string[]) {
  vi.mocked(listUnlockedAchievements).mockResolvedValue({
    ok: true,
    data: keys.map((key) => ({ key, unlockedAt: "2026-06-18T00:00:00Z" })),
  });
}

describe("evaluateNewAchievements — first_analysis", () => {
  beforeEach(() => vi.mocked(listUnlockedAchievements).mockReset());

  it("awards first_analysis on first save", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 1 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).toContain("first_analysis");
  });

  it("does not award first_analysis before any save", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 0 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).not.toContain("first_analysis");
  });

  it("does not re-award already-unlocked first_analysis", async () => {
    mockUnlocked("first_analysis");
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 5 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).not.toContain("first_analysis");
  });
});

describe("evaluateNewAchievements — ten_analyses", () => {
  beforeEach(() => vi.mocked(listUnlockedAchievements).mockReset());

  it("awards ten_analyses at exactly 10", async () => {
    mockUnlocked("first_analysis");
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 10 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).toContain("ten_analyses");
  });

  it("does not award ten_analyses at 9", async () => {
    mockUnlocked("first_analysis");
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 9 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).not.toContain("ten_analyses");
  });
});

describe("evaluateNewAchievements — streak_7", () => {
  beforeEach(() => vi.mocked(listUnlockedAchievements).mockReset());

  it("awards streak_7 at a 7-day streak", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: { ...baseProgress, currentStreak: 7 },
      stats: baseStats,
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).toContain("streak_7");
  });

  it("does not award streak_7 at streak of 6", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: { ...baseProgress, currentStreak: 6 },
      stats: baseStats,
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).not.toContain("streak_7");
  });
});

describe("evaluateNewAchievements — all_languages", () => {
  beforeEach(() => vi.mocked(listUnlockedAchievements).mockReset());

  it("awards all_languages at 7 distinct languages", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { totalAnalyses: 10, distinctLanguages: 7 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).toContain("all_languages");
  });

  it("does not award all_languages at 6 languages", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { totalAnalyses: 10, distinctLanguages: 6 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).not.toContain("all_languages");
  });
});

describe("evaluateNewAchievements — found_factorial", () => {
  beforeEach(() => vi.mocked(listUnlockedAchievements).mockReset());

  it("awards found_factorial for O(n!)", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 1 },
      timeNotation: "O(n!)",
    });
    expect(earned.map((e) => e.key)).toContain("found_factorial");
  });

  it("does not award found_factorial for O(2ⁿ)", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 1 },
      timeNotation: "O(2ⁿ)",
    });
    expect(earned.map((e) => e.key)).not.toContain("found_factorial");
  });

  it("does not award found_factorial for O(n²)", async () => {
    mockUnlocked();
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 1 },
      timeNotation: "O(n²)",
    });
    expect(earned.map((e) => e.key)).not.toContain("found_factorial");
  });
});

describe("evaluateNewAchievements — idempotency", () => {
  beforeEach(() => vi.mocked(listUnlockedAchievements).mockReset());

  it("returns empty list when all catalog keys already unlocked", async () => {
    mockUnlocked(
      "first_analysis",
      "ten_analyses",
      "streak_7",
      "all_languages",
      "found_factorial",
    );
    const earned = await evaluateNewAchievements({
      progress: { ...baseProgress, currentStreak: 10 },
      stats: { totalAnalyses: 20, distinctLanguages: 7 },
      timeNotation: "O(n!)",
    });
    expect(earned).toHaveLength(0);
  });

  it("gracefully handles DB failure (ok:false) by skipping known unlocks", async () => {
    vi.mocked(listUnlockedAchievements).mockResolvedValue({
      ok: false,
      error: "Database not configured.",
    });
    // Without knowing what's unlocked, we award everything that matches — no crash.
    const earned = await evaluateNewAchievements({
      progress: baseProgress,
      stats: { ...baseStats, totalAnalyses: 1 },
      timeNotation: "O(n)",
    });
    expect(earned.map((e) => e.key)).toContain("first_analysis");
  });
});
