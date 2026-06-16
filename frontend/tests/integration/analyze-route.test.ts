import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => auth(),
}));

import { POST } from "@/app/api/analyze/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    auth.mockReset();
    auth.mockResolvedValue({ userId: "user_test_123" });
  });

  it("rejects unauthenticated requests with 401", async () => {
    auth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ code: "x", language: "typescript" }));
    expect(res.status).toBe(401);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await POST(makeRequest("{not json"));
    expect(res.status).toBe(400);
  });

  it("rejects empty code with 400", async () => {
    const res = await POST(makeRequest({ code: "   ", language: "typescript" }));
    expect(res.status).toBe(400);
  });

  it("rejects unsupported languages with 400", async () => {
    const res = await POST(makeRequest({ code: "x = 1", language: "cobol" }));
    expect(res.status).toBe(400);
  });

  it("accepts a payload of exactly 100,000 characters with 200", async () => {
    // Use short repeated lines so the engine scan stays bounded per line.
    const line = "const x = 1;\n";
    const code = line.repeat(Math.floor(100_000 / line.length)).padEnd(100_000, "x");
    const res = await POST(makeRequest({ code, language: "typescript" }));
    expect(res.status).toBe(200);
  });

  it("rejects oversized payloads with 413", async () => {
    const res = await POST(
      makeRequest({ code: "x".repeat(100_001), language: "typescript" }),
    );
    expect(res.status).toBe(413);
  });

  it("rate-limits a user after 20 analyses in a minute", async () => {
    auth.mockResolvedValue({ userId: "user_ratelimit_test" });
    const payload = { code: "const x = 1;", language: "typescript" };

    for (let i = 0; i < 20; i++) {
      const res = await POST(makeRequest(payload));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(makeRequest(payload));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
  });

  it("never logs the submitted code — only metadata (SEC-04)", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Use a value unlikely to appear in analysis metadata or notes.
    const code = "const PRIV_SENTINEL_XYZ = 42;";

    await POST(makeRequest({ code, language: "javascript" }));

    const loggedText = logSpy.mock.calls.map(([line]) => String(line)).join("\n");
    expect(loggedText).not.toContain("PRIV_SENTINEL_XYZ");
    logSpy.mockRestore();
  });

  it("analyzes valid code end-to-end through the provider registry", async () => {
    const code = `function findMax(values) {
  let max = -Infinity;
  for (const v of values) {
    if (v > max) max = v;
  }
  return max;
}`;
    const res = await POST(makeRequest({ code, language: "javascript" }));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      analysis: {
        time: { notation: string; tier: string };
        space: { notation: string };
        provider: string;
        metrics: unknown[];
      };
    };
    expect(body.analysis.time.notation).toBe("O(n)");
    expect(body.analysis.time.tier).toBe("good");
    expect(body.analysis.provider).toBe("mock");
    expect(body.analysis.metrics).toHaveLength(4);
  });
});
