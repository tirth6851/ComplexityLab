import { describe, expect, it } from "vitest";
import {
  normalizeResult,
  buildJudge0Request,
  type Judge0Response,
} from "@/lib/execute/judge0";
import { isExecutable, JUDGE0_LANGUAGES } from "@/lib/execute/languages";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function b64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

function makeRaw(overrides: Partial<Judge0Response> = {}): Judge0Response {
  return {
    status:         { id: 3, description: "Accepted" },
    stdout:         b64("Hello\n"),
    stderr:         null,
    compile_output: null,
    time:           "0.050",
    memory:         4096,
    ...overrides,
  };
}

// ─── normalizeResult — status mapping ────────────────────────────────────────

describe("normalizeResult — status mapping", () => {
  it("maps status 3 → 'accepted'", () => {
    const r = normalizeResult(makeRaw({ status: { id: 3, description: "Accepted" } }));
    expect(r.status).toBe("accepted");
    expect(r.statusLabel).toBe("Accepted");
  });

  it("maps status 5 → 'time_limit'", () => {
    const r = normalizeResult(makeRaw({ status: { id: 5, description: "TLE" }, stdout: null }));
    expect(r.status).toBe("time_limit");
    expect(r.statusLabel).toBe("Time Limit Exceeded");
  });

  it("maps status 6 → 'compile_error'", () => {
    const r = normalizeResult(
      makeRaw({
        status:         { id: 6, description: "Compilation Error" },
        stdout:         null,
        compile_output: b64("SyntaxError: bad syntax"),
      }),
    );
    expect(r.status).toBe("compile_error");
    expect(r.statusLabel).toBe("Compilation Error");
    expect(r.compileOutput).toBe("SyntaxError: bad syntax");
  });

  it("maps status 7 (first RE id) → 'runtime_error'", () => {
    const r = normalizeResult(makeRaw({ status: { id: 7, description: "RE" }, stdout: null }));
    expect(r.status).toBe("runtime_error");
    expect(r.statusLabel).toBe("Runtime Error");
  });

  it("maps status 12 (last RE id) → 'runtime_error'", () => {
    const r = normalizeResult(makeRaw({ status: { id: 12, description: "RE" }, stdout: null }));
    expect(r.status).toBe("runtime_error");
  });

  it("maps unknown status ids → 'error'", () => {
    const r = normalizeResult(makeRaw({ status: { id: 99, description: "???" }, stdout: null }));
    expect(r.status).toBe("error");
    expect(r.statusLabel).toBe("Error");
  });

  it("maps negative / missing status id → 'error'", () => {
    // Simulates a malformed or missing status field from Judge0
    const r = normalizeResult(makeRaw({ status: { id: -1, description: "" }, stdout: null }));
    expect(r.status).toBe("error");
  });
});

// ─── normalizeResult — output decoding & truncation ──────────────────────────

describe("normalizeResult — output handling", () => {
  it("decodes base64 stdout", () => {
    const r = normalizeResult(makeRaw({ stdout: b64("Hello, World!\n") }));
    expect(r.stdout).toBe("Hello, World!\n");
  });

  it("returns null stdout when field is null", () => {
    const r = normalizeResult(makeRaw({ stdout: null }));
    expect(r.stdout).toBeNull();
  });

  it("returns null stdout when decoded value is empty string", () => {
    const r = normalizeResult(makeRaw({ stdout: b64("") }));
    expect(r.stdout).toBeNull();
  });

  it("decodes base64 stderr", () => {
    const r = normalizeResult(makeRaw({ stderr: b64("Traceback...") }));
    expect(r.stderr).toBe("Traceback...");
  });

  it("truncates stdout exceeding 64 KB and appends truncation notice", () => {
    const oversized = "x".repeat(65 * 1024); // 65 KB
    const r = normalizeResult(makeRaw({ stdout: b64(oversized) }));
    expect(r.stdout).not.toBeNull();
    expect(r.stdout!.endsWith("[output truncated]")).toBe(true);
    expect(Buffer.byteLength(r.stdout!, "utf-8")).toBeLessThan(66 * 1024);
  });

  it("does not truncate stdout within the 64 KB limit", () => {
    const exact = "y".repeat(64 * 1024 - 1); // 1 byte under limit
    const r = normalizeResult(makeRaw({ stdout: b64(exact) }));
    expect(r.stdout).toBe(exact);
  });
});

// ─── normalizeResult — timing and memory ─────────────────────────────────────

describe("normalizeResult — timing and memory", () => {
  it("converts Judge0 time string to milliseconds", () => {
    const r = normalizeResult(makeRaw({ time: "0.045" }));
    expect(r.timeMs).toBe(45);
  });

  it("rounds sub-millisecond times correctly", () => {
    const r = normalizeResult(makeRaw({ time: "0.0004" }));
    expect(r.timeMs).toBe(0); // Math.round(0.4) = 0
  });

  it("returns null timeMs when time is null", () => {
    const r = normalizeResult(makeRaw({ time: null }));
    expect(r.timeMs).toBeNull();
  });

  it("passes memoryKb through from Judge0 memory field", () => {
    const r = normalizeResult(makeRaw({ memory: 8192 }));
    expect(r.memoryKb).toBe(8192);
  });

  it("returns null memoryKb when memory field is null", () => {
    const r = normalizeResult(makeRaw({ memory: null }));
    expect(r.memoryKb).toBeNull();
  });
});

// ─── buildJudge0Request ───────────────────────────────────────────────────────

describe("buildJudge0Request", () => {
  it("base64-encodes the source code", () => {
    const req = buildJudge0Request({ languageId: 71, code: "print('hi')", stdin: "" });
    expect(Buffer.from(req.source_code as string, "base64").toString()).toBe("print('hi')");
  });

  it("base64-encodes stdin", () => {
    const req = buildJudge0Request({ languageId: 71, code: "x", stdin: "hello input" });
    expect(Buffer.from(req.stdin as string, "base64").toString()).toBe("hello input");
  });

  it("includes the language_id", () => {
    const req = buildJudge0Request({ languageId: 93, code: "x", stdin: "" });
    expect(req.language_id).toBe(93);
  });

  it("includes all required resource limits", () => {
    const req = buildJudge0Request({ languageId: 71, code: "x", stdin: "" });
    expect(req.cpu_time_limit).toBe(5);
    expect(req.wall_time_limit).toBe(8);
    expect(req.memory_limit).toBe(128_000);
    expect(req.stack_limit).toBe(64_000);
  });
});

// ─── isExecutable / JUDGE0_LANGUAGES ─────────────────────────────────────────

describe("isExecutable", () => {
  it("returns true for every language in JUDGE0_LANGUAGES", () => {
    for (const lang of Object.keys(JUDGE0_LANGUAGES)) {
      expect(isExecutable(lang)).toBe(true);
    }
  });

  it("returns false for unsupported languages", () => {
    expect(isExecutable("cobol")).toBe(false);
    expect(isExecutable("ruby")).toBe(false);
    expect(isExecutable("")).toBe(false);
  });

  it("covers all 7 app languages", () => {
    const expected = ["python", "javascript", "typescript", "java", "go", "rust", "cpp"];
    for (const lang of expected) {
      expect(isExecutable(lang)).toBe(true);
    }
    expect(Object.keys(JUDGE0_LANGUAGES)).toHaveLength(7);
  });
});
