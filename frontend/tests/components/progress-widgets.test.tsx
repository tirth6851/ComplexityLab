import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LevelCard } from "@/components/progress/level-card";
import { StreakCard } from "@/components/progress/streak-card";
import { AchievementGrid } from "@/components/progress/achievement-grid";
import { ActivityChart } from "@/components/progress/activity-chart";
import type { DailyXp, ProgressState } from "@/types";

const progress: ProgressState = {
  xp: 150,
  level: 2,
  currentStreak: 3,
  longestStreak: 7,
  lastActiveOn: "2026-06-18",
};

describe("LevelCard", () => {
  it("shows the level number", () => {
    render(<LevelCard progress={progress} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows XP to the next level", () => {
    render(<LevelCard progress={progress} />);
    // 150 XP: level 2, into=50 of span=200 → "50 / 200 XP to Lvl 3"
    expect(screen.getByText(/XP to Lvl 3/i)).toBeInTheDocument();
  });

  it("shows total XP", () => {
    render(<LevelCard progress={progress} />);
    expect(screen.getByText("150 XP")).toBeInTheDocument();
  });

  it("renders the XP progress bar", () => {
    render(<LevelCard progress={progress} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows empty-state prompt when progress is null", () => {
    render(<LevelCard progress={null} />);
    expect(screen.getByText(/save analyses to earn XP/i)).toBeInTheDocument();
  });

  it("shows empty-state prompt when XP is 0", () => {
    render(
      <LevelCard
        progress={{ xp: 0, level: 1, currentStreak: 0, longestStreak: 0, lastActiveOn: null }}
      />,
    );
    expect(screen.getByText(/save analyses to earn XP/i)).toBeInTheDocument();
  });
});

describe("StreakCard", () => {
  it("shows the current streak count", () => {
    render(<StreakCard progress={progress} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the longest streak", () => {
    render(<StreakCard progress={progress} />);
    expect(screen.getByText(/Longest: 7/i)).toBeInTheDocument();
  });

  it("uses singular 'day' when longest is 1", () => {
    render(
      <StreakCard
        progress={{ ...progress, longestStreak: 1 }}
      />,
    );
    expect(screen.getByText("Longest: 1 day")).toBeInTheDocument();
  });

  it("shows zeros when progress is null", () => {
    render(<StreakCard progress={null} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("AchievementGrid", () => {
  it("renders all achievements from the catalog", () => {
    render(<AchievementGrid unlockedKeys={[]} />);
    // All 5 achievements are rendered (locked shows ???)
    expect(screen.getAllByText("???")).toHaveLength(5);
  });

  it("shows the unlocked achievement name", () => {
    render(<AchievementGrid unlockedKeys={["first_analysis"]} />);
    expect(screen.getByText("First Steps")).toBeInTheDocument();
  });

  it("shows hint text for all achievements (locked and unlocked)", () => {
    render(<AchievementGrid unlockedKeys={["first_analysis"]} />);
    expect(screen.getByText("Save your first analysis")).toBeInTheDocument();
  });

  it("shows locked ??? for unearned achievements", () => {
    render(<AchievementGrid unlockedKeys={["first_analysis"]} />);
    // 4 of 5 are still locked
    expect(screen.getAllByText("???")).toHaveLength(4);
  });

  it("shows no locked tiles when all are unlocked", () => {
    render(
      <AchievementGrid
        unlockedKeys={[
          "first_analysis",
          "ten_analyses",
          "streak_7",
          "all_languages",
          "found_factorial",
        ]}
      />,
    );
    expect(screen.queryAllByText("???")).toHaveLength(0);
  });
});

describe("ActivityChart", () => {
  const history: DailyXp[] = [
    { date: "2026-06-15", xp: 25 },
    { date: "2026-06-17", xp: 60 },
    { date: "2026-06-18", xp: 10 },
  ];

  it("renders an SVG image with an accessible aria-label", () => {
    render(<ActivityChart history={history} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("aria-label summarises total XP and active days", () => {
    render(<ActivityChart history={history} />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("aria-label")).toMatch(/95 XP/);
    expect(svg.getAttribute("aria-label")).toMatch(/3 active day/);
  });

  it("shows the empty-state message when history is empty", () => {
    render(<ActivityChart history={[]} />);
    expect(screen.getByText(/save analyses to earn XP/i)).toBeInTheDocument();
  });
});
