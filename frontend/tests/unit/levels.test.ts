import { describe, expect, it } from "vitest";
import {
  levelFromXp,
  progressToNextLevel,
  xpForLevel,
} from "@/lib/progress/levels";

describe("xpForLevel", () => {
  it("level 1 requires 0 XP", () => expect(xpForLevel(1)).toBe(0));
  it("level 2 requires 100 XP", () => expect(xpForLevel(2)).toBe(100));
  it("level 3 requires 300 XP", () => expect(xpForLevel(3)).toBe(300));
  it("level 4 requires 600 XP", () => expect(xpForLevel(4)).toBe(600));
  it("level 5 requires 1000 XP", () => expect(xpForLevel(5)).toBe(1000));

  it("is monotonically increasing for L 2..20", () => {
    for (let L = 2; L <= 20; L++) {
      expect(xpForLevel(L)).toBeGreaterThan(xpForLevel(L - 1));
    }
  });
});

describe("levelFromXp", () => {
  it("0 XP → level 1", () => expect(levelFromXp(0)).toBe(1));
  it("99 XP → level 1", () => expect(levelFromXp(99)).toBe(1));
  it("100 XP → level 2", () => expect(levelFromXp(100)).toBe(2));
  it("299 XP → level 2", () => expect(levelFromXp(299)).toBe(2));
  it("300 XP → level 3", () => expect(levelFromXp(300)).toBe(3));
  it("599 XP → level 3", () => expect(levelFromXp(599)).toBe(3));
  it("600 XP → level 4", () => expect(levelFromXp(600)).toBe(4));
  it("999 XP → level 4", () => expect(levelFromXp(999)).toBe(4));
  it("1000 XP → level 5", () => expect(levelFromXp(1000)).toBe(5));
  it("minimum is 1 (xp=0)", () => expect(levelFromXp(0)).toBeGreaterThanOrEqual(1));

  it("is the inverse of xpForLevel at every boundary", () => {
    for (let L = 1; L <= 20; L++) {
      expect(levelFromXp(xpForLevel(L))).toBe(L);
    }
  });

  it("is monotonically non-decreasing across 0..2000", () => {
    let prev = 1;
    for (let xp = 0; xp <= 2000; xp += 5) {
      const lvl = levelFromXp(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });
});

describe("progressToNextLevel", () => {
  it("at XP=0 is at the start of level 1", () => {
    const p = progressToNextLevel(0);
    expect(p.level).toBe(1);
    expect(p.into).toBe(0);
    expect(p.span).toBe(100); // xpForLevel(2) - xpForLevel(1) = 100
    expect(p.fraction).toBe(0);
  });

  it("at XP=50 is halfway through level 1", () => {
    const p = progressToNextLevel(50);
    expect(p.level).toBe(1);
    expect(p.fraction).toBeCloseTo(0.5);
  });

  it("at XP=100 is at the start of level 2", () => {
    const p = progressToNextLevel(100);
    expect(p.level).toBe(2);
    expect(p.into).toBe(0);
    expect(p.fraction).toBe(0);
  });

  it("fraction is always within [0, 1]", () => {
    for (let xp = 0; xp <= 1200; xp += 10) {
      const { fraction } = progressToNextLevel(xp);
      expect(fraction).toBeGreaterThanOrEqual(0);
      expect(fraction).toBeLessThanOrEqual(1);
    }
  });
});
