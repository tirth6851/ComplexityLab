import { describe, it, expect, vi, afterEach } from "vitest";
import { getChatProvider } from "@/lib/ai/chat";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getChatProvider", () => {
  it("returns the mock provider when CHAT_PROVIDER=mock", () => {
    vi.stubEnv("CHAT_PROVIDER", "mock");
    const provider = getChatProvider();
    expect(provider.id).toBe("mock");
    expect(provider.name).toBeTruthy();
  });

  it("returns the groq provider when CHAT_PROVIDER=groq", () => {
    vi.stubEnv("CHAT_PROVIDER", "groq");
    const provider = getChatProvider();
    expect(provider.id).toBe("groq");
  });

  it("defaults to groq when GROQ_API_KEY is set and CHAT_PROVIDER is absent", () => {
    vi.stubEnv("CHAT_PROVIDER", "");
    vi.stubEnv("GROQ_API_KEY", "gsk_test_key");
    const provider = getChatProvider();
    expect(provider.id).toBe("groq");
  });

  it("defaults to mock when GROQ_API_KEY is absent and CHAT_PROVIDER is not set", () => {
    vi.stubEnv("CHAT_PROVIDER", "");
    vi.stubEnv("GROQ_API_KEY", "");
    const provider = getChatProvider();
    expect(provider.id).toBe("mock");
  });

  it("throws on an unknown provider id", () => {
    vi.stubEnv("CHAT_PROVIDER", "not_a_real_provider");
    expect(() => getChatProvider()).toThrow(/Unknown chat provider/);
  });

  it("accepts an explicit id override regardless of env", () => {
    vi.stubEnv("CHAT_PROVIDER", "groq");
    const provider = getChatProvider("mock");
    expect(provider.id).toBe("mock");
  });
});
