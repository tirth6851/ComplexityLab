import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";
import {
  EXECUTE_DAILY_QUOTA,
  MAX_EXEC_CODE_LENGTH,
  MAX_EXEC_STDIN_LENGTH,
} from "@/lib/limits";

// ─── Mocks (must be hoisted before any imports that use them) ────────────────

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

const mockCountExecutionsToday    = vi.fn();
const mockCountAllExecutionsToday = vi.fn();
const mockRecordExecution         = vi.fn();
vi.mock("@/lib/db/executions", () => ({
  countExecutionsToday:    () => mockCountExecutionsToday(),
  countAllExecutionsToday: () => mockCountAllExecutionsToday(),
  recordExecution:         (r: unknown) => mockRecordExecution(r),
}));

// Stub global fetch to intercept Judge0 HTTP calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Route import (after mocks) ───────────────────────────────────────────────

import { POST } from "@/app/api/execute/route";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/execute", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

function makeRawJudge0Response(overrides: {
  statusId?:      number;
  stdout?:        string | null;
  compileOutput?: string | null;
} = {}) {
  const {
    statusId      = 3,
    stdout        = "Hello\n",
    compileOutput = null,
  } = overrides;

  return {
    status:         { id: statusId, description: "Accepted" },
    stdout:         stdout ? Buffer.from(stdout, "utf-8").toString("base64") : null,
    stderr:         null,
    compile_output: compileOutput
      ? Buffer.from(compileOutput, "utf-8").toString("base64")
      : null,
    time:   "0.050",
    memory: 4096,
  };
}

function mockJudge0Resolves(overrides = {}) {
  mockFetch.mockResolvedValue({
    ok:   true,
    json: async () => makeRawJudge0Response(overrides),
  });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("POST /api/execute", () => {
  beforeEach(() => {
    // Auth: authenticated by default
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({ userId: "user_test_exec_123" });

    // DB: quota not reached, record succeeds, global count zero
    mockCountExecutionsToday.mockReset();
    mockCountExecutionsToday.mockResolvedValue({ ok: true, data: 0 });
    mockCountAllExecutionsToday.mockReset();
    mockCountAllExecutionsToday.mockResolvedValue({ ok: true, data: 0 });
    mockRecordExecution.mockReset();
    mockRecordExecution.mockResolvedValue({ ok: true, data: null });

    // Fetch: Judge0 returns an accepted result
    mockFetch.mockReset();
    mockJudge0Resolves();

    // Ensure rate-limit buckets are clean between tests
    resetRateLimits();

    // Provide a fake API key so callJudge0 doesn't throw before fetch
    process.env.JUDGE0_API_KEY = "test-key-execute";

    // Clear any lingering kill-switch env vars so tests are isolated
    delete process.env.JUDGE0_GLOBAL_DAILY_CAP;
    delete process.env.JUDGE0_ENABLED;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    delete process.env.JUDGE0_API_KEY;
    delete process.env.JUDGE0_GLOBAL_DAILY_CAP;
    delete process.env.JUDGE0_ENABLED;
  });

  // ── Configuration guard ─────────────────────────────────────────────────────

  it("returns 503 when JUDGE0_API_KEY is not configured", async () => {
    delete process.env.JUDGE0_API_KEY;
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/not available/i);
    // Restore so subsequent tests in this suite still have the key
    process.env.JUDGE0_API_KEY = "test-key-execute";
  });

  // ── Authentication ──────────────────────────────────────────────────────────

  it("returns 401 when user is not signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/sign in/i);
  });

  // ── Input validation ────────────────────────────────────────────────────────

  it("returns 400 for malformed JSON body", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/execute", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    "{not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is empty", async () => {
    const res = await POST(makeRequest({ code: "   ", language: "python" }));
    expect(res.status).toBe(400);
  });

  it("returns 413 when code exceeds MAX_EXEC_CODE_LENGTH", async () => {
    const res = await POST(
      makeRequest({ code: "x".repeat(MAX_EXEC_CODE_LENGTH + 1), language: "python" }),
    );
    expect(res.status).toBe(413);
  });

  it("returns 400 for unsupported languages", async () => {
    const res = await POST(makeRequest({ code: "10 PRINT 'HELLO'", language: "basic" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when stdin exceeds MAX_EXEC_STDIN_LENGTH", async () => {
    const res = await POST(
      makeRequest({
        code:     "print(input())",
        language: "python",
        stdin:    "x".repeat(MAX_EXEC_STDIN_LENGTH + 1),
      }),
    );
    expect(res.status).toBe(400);
  });

  // ── Rate limiting ───────────────────────────────────────────────────────────

  it("returns 429 with Retry-After after per-minute burst is exhausted", async () => {
    // Use a unique userId so previous test runs don't affect this bucket
    mockAuth.mockResolvedValue({ userId: "user_rl_execute_burst" });
    const payload = { code: "print(1)", language: "python" };

    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest(payload));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(makeRequest(payload));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
  });

  it("returns 429 when daily quota is reached", async () => {
    mockCountExecutionsToday.mockResolvedValue({
      ok:   true,
      data: EXECUTE_DAILY_QUOTA,
    });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(429);
    const body = await res.json() as { error: string };
    expect(body.error).toContain("limit reached");
  });

  // ── Graceful degradation ────────────────────────────────────────────────────

  it("allows execution when quota DB check fails (graceful degradation)", async () => {
    mockCountExecutionsToday.mockResolvedValue({
      ok:    false,
      error: "Table code_executions does not exist",
    });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { result: { status: string } };
    expect(body.result.status).toBe("accepted");
  });

  it("returns 200 with the result even when recordExecution fails", async () => {
    mockRecordExecution.mockResolvedValue({ ok: false, error: "Insert failed" });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { result: { status: string } };
    expect(body.result.status).toBe("accepted");
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns 200 with an accepted ExecutionResult for valid Python", async () => {
    const res = await POST(makeRequest({ code: "print('hello')", language: "python" }));
    expect(res.status).toBe(200);

    const body = await res.json() as {
      result: {
        status:      string;
        statusLabel: string;
        stdout:      string;
        timeMs:      number;
        memoryKb:    number;
      };
    };
    expect(body.result.status).toBe("accepted");
    expect(body.result.statusLabel).toBe("Accepted");
    expect(body.result.stdout).toBe("Hello\n");
    expect(body.result.timeMs).toBe(50);    // "0.050" × 1000
    expect(body.result.memoryKb).toBe(4096);
  });

  it("accepts stdin and passes it through (does not reject empty stdin)", async () => {
    // stdin defaults to "" when not provided — no 400 should fire
    const res = await POST(makeRequest({ code: "print(input())", language: "python" }));
    expect(res.status).toBe(200);
  });

  // ── Execution error paths ───────────────────────────────────────────────────

  it("returns 200 with compile_error result when Judge0 returns status 6", async () => {
    mockJudge0Resolves({
      statusId:      6,
      stdout:        null,
      compileOutput: "SyntaxError: unexpected EOF",
    });

    const res = await POST(makeRequest({ code: "def bad(", language: "python" }));
    expect(res.status).toBe(200);

    const body = await res.json() as {
      result: { status: string; compileOutput: string; stdout: null };
    };
    expect(body.result.status).toBe("compile_error");
    expect(body.result.compileOutput).toBe("SyntaxError: unexpected EOF");
    expect(body.result.stdout).toBeNull();
  });

  it("returns 200 with error result when Judge0 is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);

    const body = await res.json() as {
      result: { status: string; statusLabel: string };
    };
    expect(body.result.status).toBe("error");
    expect(body.result.statusLabel).toMatch(/unavailable/i);
  });

  it("returns 200 with timed-out statusLabel when the abort signal fires", async () => {
    // fetch throws an Error whose name is "AbortError" when the AbortSignal fires
    const abortErr = new Error("This operation was aborted");
    abortErr.name = "AbortError";
    mockFetch.mockRejectedValue(abortErr);

    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);

    const body = await res.json() as {
      result: { status: string; statusLabel: string };
    };
    expect(body.result.status).toBe("error");
    expect(body.result.statusLabel).toMatch(/timed out/i);
  });

  it("returns 200 with error result when Judge0 returns non-2xx HTTP", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" });

    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);

    const body = await res.json() as { result: { status: string } };
    expect(body.result.status).toBe("error");
  });

  // ── recordExecution payload verification ────────────────────────────────────

  it("records only execution metadata — not code, stdin, or stdout", async () => {
    const SENTINEL = "PRIV_EXEC_SENTINEL_CODE_7x9z";
    mockJudge0Resolves({ stdout: "PRIV_STDOUT_SENTINEL_7x9z" });

    await POST(makeRequest({ code: SENTINEL, language: "python" }));

    expect(mockRecordExecution).toHaveBeenCalledTimes(1);
    const recorded = JSON.stringify(mockRecordExecution.mock.calls[0][0]);
    expect(recorded).not.toContain(SENTINEL);
    expect(recorded).not.toContain("PRIV_STDOUT");

    // Must contain the expected metadata fields
    const record = mockRecordExecution.mock.calls[0][0] as {
      language: string;
      status:   string;
    };
    expect(record.language).toBe("python");
    expect(record.status).toBe("accepted");
  });

  // ── Privacy / security ──────────────────────────────────────────────────────

  it("never logs submitted code or stdout (SEC privacy parity)", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const CODE_SENTINEL   = "PRIV_EXEC_LOG_CODE_SENTINEL_abc123";
    const STDOUT_SENTINEL = "PRIV_EXEC_LOG_OUT_SENTINEL_xyz789";

    mockJudge0Resolves({ stdout: STDOUT_SENTINEL });

    await POST(makeRequest({ code: CODE_SENTINEL, language: "python" }));

    const allLogged = logSpy.mock.calls.map(([line]) => String(line)).join("\n");
    expect(allLogged).not.toContain(CODE_SENTINEL);
    expect(allLogged).not.toContain(STDOUT_SENTINEL);

    logSpy.mockRestore();
  });

  // ── Emergency disable ───────────────────────────────────────────────────────

  it("returns 503 when JUDGE0_ENABLED is set to false", async () => {
    process.env.JUDGE0_ENABLED = "false";
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/disabled|temporarily/i);
  });

  it("allows execution when JUDGE0_ENABLED is omitted (default on)", async () => {
    delete process.env.JUDGE0_ENABLED;
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);
  });

  // ── Global daily cap ────────────────────────────────────────────────────────

  it("skips global cap check when JUDGE0_GLOBAL_DAILY_CAP is not set", async () => {
    delete process.env.JUDGE0_GLOBAL_DAILY_CAP;
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);
    expect(mockCountAllExecutionsToday).not.toHaveBeenCalled();
  });

  it("allows execution when global count is under the cap", async () => {
    process.env.JUDGE0_GLOBAL_DAILY_CAP = "900";
    mockCountAllExecutionsToday.mockResolvedValue({ ok: true, data: 899 });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(200);
  });

  it("returns 503 when global cap is exactly reached", async () => {
    process.env.JUDGE0_GLOBAL_DAILY_CAP = "900";
    mockCountAllExecutionsToday.mockResolvedValue({ ok: true, data: 900 });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/temporarily unavailable|try again/i);
  });

  it("returns 503 when global count exceeds cap", async () => {
    process.env.JUDGE0_GLOBAL_DAILY_CAP = "900";
    mockCountAllExecutionsToday.mockResolvedValue({ ok: true, data: 1200 });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    expect(res.status).toBe(503);
  });

  it("allows execution when global cap DB check fails (graceful degradation)", async () => {
    process.env.JUDGE0_GLOBAL_DAILY_CAP = "900";
    mockCountAllExecutionsToday.mockResolvedValue({
      ok:    false,
      error: "relation code_executions does not exist",
    });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    // Fail-open: DB unavailable means we cannot confirm cap was reached — allow
    expect(res.status).toBe(200);
    const body = await res.json() as { result: { status: string } };
    expect(body.result.status).toBe("accepted");
  });

  it("ignores global cap when JUDGE0_GLOBAL_DAILY_CAP is 0 (disabled)", async () => {
    process.env.JUDGE0_GLOBAL_DAILY_CAP = "0";
    mockCountAllExecutionsToday.mockResolvedValue({ ok: true, data: 99999 });
    const res = await POST(makeRequest({ code: "print(1)", language: "python" }));
    // cap=0 means disabled — no check should run
    expect(res.status).toBe(200);
    expect(mockCountAllExecutionsToday).not.toHaveBeenCalled();
  });
});
