import { describe, expect, it } from "vitest";
import { analyzeCode, findFunctionNames, stripNoise } from "@/lib/analysis/engine";
import { SAMPLES } from "@/lib/analysis/samples";
import { LANGUAGES } from "@/lib/analysis/languages";

describe("analyzeCode — sample templates land on their expected class", () => {
  for (const { id: language } of LANGUAGES) {
    for (const sample of SAMPLES[language]) {
      it(`${language}/${sample.name} → ${sample.expectedTime}`, () => {
        const result = analyzeCode({ code: sample.code, language });
        expect(result.time.notation).toBe(sample.expectedTime);
      });
    }
  }
});

describe("analyzeCode — structure", () => {
  it("is deterministic", () => {
    const input = { code: SAMPLES.typescript[0].code, language: "typescript" };
    expect(analyzeCode(input)).toEqual(analyzeCode(input));
  });

  it("returns a complete result shape", () => {
    const r = analyzeCode({
      code: SAMPLES.typescript[2].code,
      language: "typescript",
    });
    expect(r.time.tier).toBe("poor"); // bubble sort O(n²)
    expect(r.space.notation).toBeTruthy();
    expect(r.verdict).toContain("O(n²)");
    expect(r.notes.length).toBeGreaterThan(0);
    expect(r.metrics).toHaveLength(4);
    for (const m of r.metrics) {
      expect(m.fraction).toBeGreaterThanOrEqual(0);
      expect(m.fraction).toBeLessThanOrEqual(1);
    }
    expect(r.confidence).toBeGreaterThanOrEqual(0.4);
    expect(r.confidence).toBeLessThanOrEqual(0.95);
    expect(r.provider).toBe("mock");
  });

  it("reports linear stack space for naive branching recursion", () => {
    const fib = SAMPLES.typescript.find((s) => s.id === "ts-fib-naive");
    const r = analyzeCode({ code: fib!.code, language: "typescript" });
    expect(r.time.notation).toBe("O(2ⁿ)");
    expect(r.space.notation).toBe("O(n)");
    expect(r.time.tier).toBe("critical");
  });

  it("reports constant space for iterative binary search", () => {
    const bs = SAMPLES.typescript.find((s) => s.id === "ts-binary-search");
    const r = analyzeCode({ code: bs!.code, language: "typescript" });
    expect(r.space.notation).toBe("O(1)");
  });

  it("handles empty input gracefully", () => {
    const r = analyzeCode({ code: "   \n  ", language: "typescript" });
    expect(r.time.notation).toBe("O(1)");
    expect(r.confidence).toBeLessThanOrEqual(0.5);
  });

  it("ignores loops inside comments and strings", () => {
    const code = `
// for (let i = 0; i < n; i++) { for (j...) {} }
const label = "while (true) { loop forever }";
function constantTime(x: number) {
  return x + 1;
}
`;
    const r = analyzeCode({ code, language: "typescript" });
    expect(r.time.notation).toBe("O(1)");
  });

  it("detects a sort call as at least O(n log n)", () => {
    const code = `function sortAll(values: number[]) {\n  return values.sort((a, b) => a - b);\n}`;
    const r = analyzeCode({ code, language: "typescript" });
    expect(r.time.notation).toBe("O(n log n)");
  });

  it("caps triple nesting at O(n³)", () => {
    const code = `
function triple(n: number) {
  let acc = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        acc += i * j * k;
      }
    }
  }
  return acc;
}`;
    const r = analyzeCode({ code, language: "typescript" });
    expect(r.time.notation).toBe("O(n³)");
  });

  it("treats functional iteration as a loop level", () => {
    const code = `function squares(xs: number[]) {\n  return xs.map((x) => x * x);\n}`;
    const r = analyzeCode({ code, language: "typescript" });
    expect(r.time.notation).toBe("O(n)");
  });
});

describe("stripNoise", () => {
  it("removes line and block comments for brace languages", () => {
    const out = stripNoise("a; // for while\n/* for */ b;", "typescript");
    expect(out).not.toMatch(/for|while/);
  });

  it("removes # comments only for python", () => {
    expect(stripNoise("x = 1  # for loop note", "python")).not.toContain("for");
    expect(stripNoise("const tag = 1; // #for", "typescript")).not.toContain(
      "for",
    );
  });
});

describe("findFunctionNames", () => {
  it("finds declarations across language families", () => {
    expect(findFunctionNames("function alpha() {}")).toContain("alpha");
    expect(findFunctionNames("def beta(x):\n    return x")).toContain("beta");
    expect(findFunctionNames("func gamma(x int) int { return x }")).toContain(
      "gamma",
    );
    expect(findFunctionNames("fn delta(x: i32) -> i32 { x }")).toContain(
      "delta",
    );
  });
});
