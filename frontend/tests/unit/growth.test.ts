import { describe, expect, it } from "vitest";
import { formatOps, growthValue } from "@/lib/analysis/growth";

describe("growthValue", () => {
  it("computes the canonical growth functions at n=1000", () => {
    expect(growthValue("O(1)", 1000)).toBe(1);
    expect(growthValue("O(log n)", 1000)).toBeCloseTo(Math.log2(1000), 5);
    expect(growthValue("O(n)", 1000)).toBe(1000);
    expect(growthValue("O(n log n)", 1000)).toBeCloseTo(
      1000 * Math.log2(1000),
      2,
    );
    expect(growthValue("O(n²)", 1000)).toBe(1_000_000);
    expect(growthValue("O(n³)", 1000)).toBe(1_000_000_000);
  });

  it("tolerates spacing and caret notation", () => {
    expect(growthValue("O(n^2)", 10)).toBe(100);
    expect(growthValue("o( n log n )", 8)).toBeCloseTo(24, 5);
  });

  it("keeps exponential/factorial growth finite", () => {
    expect(Number.isFinite(growthValue("O(2ⁿ)", 10_000))).toBe(true);
    expect(Number.isFinite(growthValue("O(n!)", 10_000))).toBe(true);
  });

  it("never returns less than the floor for tiny n", () => {
    expect(growthValue("O(log n)", 1)).toBe(1);
    expect(growthValue("O(n)", 0)).toBe(1);
  });

  it("falls back to linear for unknown notations", () => {
    expect(growthValue("O(α(n))", 500)).toBe(500);
  });
});

describe("formatOps", () => {
  it("formats small numbers plainly", () => {
    expect(formatOps(999)).toBe("999");
    expect(formatOps(0)).toBe("0");
  });

  it("uses compact suffixes", () => {
    expect(formatOps(10_400)).toBe("~10.4K");
    expect(formatOps(1_000_000_000)).toBe("~1.0B");
  });

  it("falls back to powers of ten for huge values", () => {
    expect(formatOps(1e30)).toBe("10^30");
  });
});
