import { describe, expect, it } from "vitest";
import {
  complexityLevel,
  complexityTier,
  tierFromNotation,
} from "@/lib/complexity";
import type { Complexity } from "@/types";

/** Every canonical Big-O class the visual system has a dedicated stop for. */
const CANONICAL: Complexity[] = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(n³)",
  "O(2ⁿ)",
  "O(n!)",
];

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
  // The core guarantee: an AI-produced verdict and a heuristic-engine verdict
  // for the SAME Big-O class must land on the same tier/color/label.
  it("agrees with complexityTier() for every canonical Big-O class", () => {
    for (const c of CANONICAL) {
      expect(tierFromNotation(c)).toBe(complexityTier(c));
    }
  });

  it("maps every canonical class to its expected tier", () => {
    expect(tierFromNotation("O(1)")).toBe("optimal");
    expect(tierFromNotation("O(log n)")).toBe("optimal");
    expect(tierFromNotation("O(n)")).toBe("good");
    expect(tierFromNotation("O(n log n)")).toBe("fair");
    expect(tierFromNotation("O(n²)")).toBe("poor");
    expect(tierFromNotation("O(n³)")).toBe("poor");
    expect(tierFromNotation("O(2ⁿ)")).toBe("critical");
    expect(tierFromNotation("O(n!)")).toBe("critical");
  });

  it("handles ASCII and alternate notations identically", () => {
    expect(tierFromNotation("O(n^2)")).toBe("poor");
    expect(tierFromNotation("O(n^3)")).toBe("poor");
    expect(tierFromNotation("O(n^4)")).toBe("poor");
    expect(tierFromNotation("O(2^n)")).toBe("critical");
    expect(tierFromNotation("O(k^n)")).toBe("critical");
    expect(tierFromNotation("O(n^n)")).toBe("critical");
    expect(tierFromNotation("O(n*log n)")).toBe("fair");
    expect(tierFromNotation("o(n log n)")).toBe("fair"); // case-insensitive
    expect(tierFromNotation("O(c)")).toBe("optimal");
  });

  it("falls back to good for linear and unrecognized shapes", () => {
    expect(tierFromNotation("O(n)")).toBe("good");
    expect(tierFromNotation("")).toBe("good");
    expect(tierFromNotation("not a notation")).toBe("good");
  });
});
