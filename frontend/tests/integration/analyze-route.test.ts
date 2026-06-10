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

  it("rejects oversized payloads with 413", async () => {
    const res = await POST(
      makeRequest({ code: "x".repeat(100_001), language: "typescript" }),
    );
    expect(res.status).toBe(413);
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
