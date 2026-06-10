import { afterEach, describe, expect, it, vi } from "vitest";
import { getAnalysisProvider } from "@/lib/ai";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAnalysisProvider", () => {
  it("defaults to the mock heuristic engine", () => {
    expect(getAnalysisProvider().id).toBe("mock");
  });

  it("honors AI_PROVIDER from the environment", () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    expect(getAnalysisProvider().id).toBe("mock");
  });

  it("rejects unknown provider ids", () => {
    expect(() => getAnalysisProvider("skynet")).toThrow(/Unknown AI provider/);
  });

  it("rejects scaffolded-but-unimplemented providers", () => {
    expect(() => getAnalysisProvider("openai")).toThrow(/not implemented/);
    expect(() => getAnalysisProvider("anthropic")).toThrow(/not implemented/);
    expect(() => getAnalysisProvider("gemini")).toThrow(/not implemented/);
  });

  it("exposes groq as scaffolded: resolvable but not yet analyzable", async () => {
    const groq = getAnalysisProvider("groq");
    expect(groq.id).toBe("groq");
    await expect(
      groq.analyze({ code: "x", language: "typescript" }),
    ).rejects.toThrow(/not enabled/);
  });

  it("mock provider produces a CodeAnalysis", async () => {
    const result = await getAnalysisProvider("mock").analyze({
      code: "function f(xs) { for (const x of xs) {} }",
      language: "javascript",
    });
    expect(result.provider).toBe("mock");
    expect(result.time.notation).toBe("O(n)");
  });
});
