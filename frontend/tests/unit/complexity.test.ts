import { describe, expect, it } from "vitest";
import {
  complexityLevel,
  complexityTier,
  tierFromNotation,
} from "@/lib/complexity";

describe("complexityLevel", () => {
  it("maps the canonical classes onto the 5-stop gradient", () => {
    expect(complexityLevel("O(1)")).toBe(1);
    expect(complexityLevel("O(log n)")).toBe(1);
    expect(complexityLevel("O(n)")).toBe(2);
    expect(complexityLevel("O(n log n)")).toBe(3);
    expect(complexityLevel("O(n²)")).toBe(4);
    expect(complexityLevel("O(n³)")).toBe(4);
    expect(complexityLevel("O(2ⁿ)")).toBe(5);
    expect(complexityLevel("O(n!)")).toBe(5);
  });
});

describe("complexityTier", () => {
  it("agrees with the level mapping", () => {
    expect(complexityTier("O(1)")).toBe("optimal");
    expect(complexityTier("O(n)")).toBe("good");
    expect(complexityTier("O(n log n)")).toBe("fair");
    expect(complexityTier("O(n²)")).toBe("poor");
    expect(complexityTier("O(2ⁿ)")).toBe("critical");
  });
});

describe("tierFromNotation (free-form input)", () => {
  it("detects exponential and factorial as critical", () => {
    expect(tierFromNotation("O(2^n)")).toBe("critical");
    expect(tierFromNotation("O(2ⁿ)")).toBe("critical");
    expect(tierFromNotation("O(n!)")).toBe("critical");
  });

  it("detects cubic as poor and quadratic as fair", () => {
    expect(tierFromNotation("O(n^3)")).toBe("poor");
    expect(tierFromNotation("O(n³)")).toBe("poor");
    expect(tierFromNotation("O(n^2)")).toBe("fair");
    expect(tierFromNotation("O(n²)")).toBe("fair");
  });

  it("detects constant/log as optimal and falls back to good", () => {
    expect(tierFromNotation("O(1)")).toBe("optimal");
    expect(tierFromNotation("O(log n)")).toBe("optimal");
    expect(tierFromNotation("O(n)")).toBe("good");
    expect(tierFromNotation("")).toBe("good");
  });
});
