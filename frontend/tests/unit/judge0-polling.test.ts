/**
 * Tests for callJudge0's token-only polling fallback.
 * These cover the path added to handle free-tier Judge0 (RapidAPI) which
 * returns { token } instead of a full result when wait=true is unsupported.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callJudge0 } from "@/lib/execute/judge0";

function b64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

const ACCEPTED_RESPONSE = {
  status: { id: 3, description: "Accepted" },
  stdout: b64("Hello\n"),
  stderr: null,
  compile_output: null,
  time: "0.050",
  memory: 4096,
};

const TOKEN_RESPONSE = { token: "abc-def-123" };

const QUEUED_RESPONSE = {
  status: { id: 1, description: "In Queue" },
  stdout: null,
  stderr: null,
  compile_output: null,
  time: null,
  memory: null,
};

const INPUT = { languageId: 71, code: "print('hi')", stdin: "" };

describe("callJudge0 — token-only polling fallback", () => {
  beforeEach(() => {
    process.env.JUDGE0_API_KEY = "test-key";
    process.env.JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";
    vi.restoreAllMocks();
  });

  it("returns the result directly when wait=true works (no polling needed)", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ACCEPTED_RESPONSE),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await callJudge0(INPUT);
    expect(result.status.id).toBe(3);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("polls when the initial POST returns a token-only response", async () => {
    const mockFetch = vi
      .fn()
      // Initial POST → token only
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(TOKEN_RESPONSE) })
      // First poll → accepted
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ACCEPTED_RESPONSE) });

    vi.stubGlobal("fetch", mockFetch);

    const result = await callJudge0(INPUT);
    expect(result.status.id).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify the poll URL contains the token
    const pollUrl = (mockFetch.mock.calls[1] as unknown[])[0] as string;
    expect(pollUrl).toContain("abc-def-123");
    expect(pollUrl).toContain("base64_encoded=true");
  });

  it("retries on In Queue / Processing status before getting terminal result", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(TOKEN_RESPONSE) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(QUEUED_RESPONSE) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ACCEPTED_RESPONSE) });

    vi.stubGlobal("fetch", mockFetch);

    const result = await callJudge0(INPUT);
    expect(result.status.id).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws when JUDGE0_API_KEY is missing", async () => {
    delete process.env.JUDGE0_API_KEY;
    await expect(callJudge0(INPUT)).rejects.toThrow("JUDGE0_API_KEY is not configured");
  });

  it("throws when the initial POST returns non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    }));

    await expect(callJudge0(INPUT)).rejects.toThrow("403");
  });

  it("throws when all polls are exhausted without a terminal status", async () => {
    const alwaysQueued = { ok: true, json: () => Promise.resolve(QUEUED_RESPONSE) };
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(TOKEN_RESPONSE) })
      .mockResolvedValue(alwaysQueued);

    vi.stubGlobal("fetch", mockFetch);

    await expect(callJudge0(INPUT)).rejects.toThrow("did not complete after");
  });
});
