import { afterEach, describe, expect, it, vi } from "vitest";
import { getAnalysisProvider } from "@/lib/ai";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAnalysisProvider", () => {
  it("defaults to the mock heuristic engine when no Groq key is set", () => {
    vi.stubEnv("GROQ_API_KEY", "");
    expect(getAnalysisProvider().id).toBe("mock");
  });

  it("defaults to groq when a real key is configured", () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_real_key");
    expect(getAnalysisProvider().id).toBe("groq");
  });

  it("treats placeholder keys as unconfigured", () => {
    vi.stubEnv("GROQ_API_KEY", "<your-groq-api-key>");
    expect(getAnalysisProvider().id).toBe("mock");
  });

  it("honors an explicit AI_PROVIDER over the default", () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_real_key");
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

  it("resolves the groq provider", () => {
    const groq = getAnalysisProvider("groq");
    expect(groq.id).toBe("groq");
    expect(groq.name).toBe("Groq");
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
