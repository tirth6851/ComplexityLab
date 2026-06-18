import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/progress", () => ({
  awardProgress: vi.fn(),
  getProgressStats: vi.fn(),
  listUnlockedAchievements: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  logEvent: vi.fn(),
}));

import { awardProgressForSave } from "@/lib/progress/award";
import {
  awardProgress,
  getProgressStats,
  listUnlockedAchievements,
} from "@/lib/db/progress";
import { logEvent } from "@/lib/log";
import type { ProgressState, ProgressStats } from "@/types";
import { analyzeCode } from "@/lib/analysis/engine";

const code = `function f(n) { return n; }`;
const analysis = analyzeCode({ code, language: "javascript" });

const mockProgress: ProgressState = {
  xp: 10,
  level: 1,
  currentStreak: 1,
  longestStreak: 1,
  lastActiveOn: "2026-06-18",
};
const mockStats: ProgressStats = { totalAnalyses: 1, distinctLanguages: 1 };

describe("awardProgressForSave", () => {
  beforeEach(() => {
    vi.mocked(awardProgress).mockReset();
    vi.mocked(getProgressStats).mockReset();
    vi.mocked(listUnlockedAchievements).mockReset();
    vi.mocked(logEvent).mockReset();
  });

  it("calls apply_progress_event with save + countsForStreak:true", async () => {
    vi.mocked(awardProgress).mockResolvedValue({ ok: true, data: mockProgress });
    vi.mocked(getProgressStats).mockResolvedValue({ ok: true, data: mockStats });
    vi.mocked(listUnlockedAchievements).mockResolvedValue({ ok: true, data: [] });

    await awardProgressForSave({ language: "javascript", analysis });

    expect(awardProgress).toHaveBeenCalledWith(
      expect.objectContaining({ type: "save", amount: 10, countsForStreak: true }),
    );
  });

  it("does not throw when awardProgress fails", async () => {
    vi.mocked(awardProgress).mockResolvedValue({
      ok: false,
      error: "Database not configured.",
    });

    await expect(
      awardProgressForSave({ language: "javascript", analysis }),
    ).resolves.toBeUndefined();
  });

  it("logs an error when awardProgress fails and stops early", async () => {
    vi.mocked(awardProgress).mockResolvedValue({
      ok: false,
      error: "Database not configured.",
    });

    await awardProgressForSave({ language: "javascript", analysis });

    expect(logEvent).toHaveBeenCalledWith(
      "progress.error",
      expect.objectContaining({ step: "save" }),
    );
    // Should not have tried to fetch stats or award achievements.
    expect(getProgressStats).not.toHaveBeenCalled();
  });

  it("awards first_analysis achievement on first save", async () => {
    vi.mocked(awardProgress).mockResolvedValue({ ok: true, data: mockProgress });
    vi.mocked(getProgressStats).mockResolvedValue({ ok: true, data: mockStats });
    vi.mocked(listUnlockedAchievements).mockResolvedValue({ ok: true, data: [] });

    await awardProgressForSave({ language: "javascript", analysis });

    const calls = vi.mocked(awardProgress).mock.calls;
    const achievementCalls = calls.filter(
      ([arg]) => arg.type === "achievement",
    );
    expect(achievementCalls.length).toBeGreaterThanOrEqual(1);
    expect(achievementCalls[0][0]).toMatchObject({
      type: "achievement",
      meta: { key: "first_analysis" },
    });
  });

  it("does not award achievements when stats call fails", async () => {
    vi.mocked(awardProgress).mockResolvedValue({ ok: true, data: mockProgress });
    vi.mocked(getProgressStats).mockResolvedValue({
      ok: false,
      error: "Database not configured.",
    });

    await awardProgressForSave({ language: "javascript", analysis });

    const achievementCalls = vi.mocked(awardProgress).mock.calls.filter(
      ([arg]) => arg.type === "achievement",
    );
    expect(achievementCalls).toHaveLength(0);
  });

  it("does not throw even when an achievement award fails", async () => {
    vi.mocked(awardProgress)
      .mockResolvedValueOnce({ ok: true, data: mockProgress }) // save
      .mockResolvedValue({ ok: false, error: "DB error." });   // achievement
    vi.mocked(getProgressStats).mockResolvedValue({ ok: true, data: mockStats });
    vi.mocked(listUnlockedAchievements).mockResolvedValue({ ok: true, data: [] });

    await expect(
      awardProgressForSave({ language: "javascript", analysis }),
    ).resolves.toBeUndefined();
  });
});
