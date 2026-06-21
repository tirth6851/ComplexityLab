/**
 * Server-side HTTP client for Judge0 CE (via RapidAPI).
 *
 * Responsibilities:
 *   buildJudge0Request — assemble the submission payload with resource limits
 *   callJudge0         — POST to the Judge0 submissions endpoint (wait=true)
 *   normalizeResult    — map Judge0 response → ExecutionResult (our domain type)
 *
 * Privacy: this module never logs or persists code, stdin, or stdout.
 * Callers must enforce the same contract.
 *
 * Fallback note: if the RapidAPI free tier does not support wait=true, the
 * endpoint returns a token and you must poll GET /submissions/{token}?base64_encoded=true
 * with backoff (≤ 5 polls × 1 s). That path is NOT implemented here — verify
 * wait=true is available before first deploy and add polling only if needed.
 */

import type { ExecutionResult, ExecutionStatus } from "./types";

// ─── Resource limits sent to Judge0 with every submission ────────────────────

const RESOURCE_LIMITS = {
  cpu_time_limit:  5,        // seconds of CPU time
  wall_time_limit: 8,        // hard wall-clock ceiling (route maxDuration=15 gives margin)
  memory_limit:    128_000,  // KB (~128 MB)
  stack_limit:     64_000,   // KB; prevents deep-recursion blowups
} as const;

/** Output beyond this is truncated in normalizeResult. */
const MAX_OUTPUT_BYTES = 64 * 1024;

// ─── Judge0 response type (before normalization) ─────────────────────────────

export interface Judge0Response {
  status: { id: number; description: string };
  /** Base64-encoded stdout (when base64_encoded=true). */
  stdout:         string | null;
  /** Base64-encoded stderr. */
  stderr:         string | null;
  /** Base64-encoded compiler output. */
  compile_output: string | null;
  /** Execution time as a decimal string in seconds, e.g. "0.045". */
  time:   string | null;
  /** Peak memory in KB. */
  memory: number | null;
}

// ─── Judge0 status ID → normalized ExecutionStatus ───────────────────────────

function mapStatus(id: number): { status: ExecutionStatus; label: string } {
  if (id === 3)                return { status: "accepted",      label: "Accepted" };
  if (id === 5)                return { status: "time_limit",    label: "Time Limit Exceeded" };
  if (id === 6)                return { status: "compile_error", label: "Compilation Error" };
  if (id >= 7 && id <= 12)    return { status: "runtime_error", label: "Runtime Error" };
  return                              { status: "error",         label: "Error" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decodeBase64(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf-8");
    return decoded || null;
  } catch {
    return null;
  }
}

function truncate(value: string | null, maxBytes: number): string | null {
  if (!value) return null;
  const buf = Buffer.from(value, "utf-8");
  if (buf.byteLength <= maxBytes) return value;
  return buf.subarray(0, maxBytes).toString("utf-8") + "\n[output truncated]";
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface Judge0SubmissionInput {
  languageId: number;
  code:       string;
  stdin:      string;
}

/** Assembles the request body for a Judge0 submission. Pure; testable in isolation. */
export function buildJudge0Request(
  input: Judge0SubmissionInput,
): Record<string, unknown> {
  return {
    language_id:  input.languageId,
    source_code:  Buffer.from(input.code,  "utf-8").toString("base64"),
    stdin:        Buffer.from(input.stdin, "utf-8").toString("base64"),
    ...RESOURCE_LIMITS,
  };
}

/** Maps a raw Judge0 response → ExecutionResult. Pure; testable in isolation. */
export function normalizeResult(raw: Judge0Response): ExecutionResult {
  const { status, label } = mapStatus(raw.status?.id ?? -1);

  return {
    status,
    statusLabel:   label,
    stdout:        truncate(decodeBase64(raw.stdout),         MAX_OUTPUT_BYTES),
    stderr:        truncate(decodeBase64(raw.stderr),         MAX_OUTPUT_BYTES),
    compileOutput: truncate(decodeBase64(raw.compile_output), MAX_OUTPUT_BYTES),
    timeMs:        raw.time != null ? Math.round(parseFloat(raw.time) * 1000) : null,
    memoryKb:      raw.memory ?? null,
  };
}

/**
 * Submits code to Judge0 CE and waits for the result (wait=true).
 * Throws on network failure or non-2xx HTTP response — callers must handle.
 *
 * @param signal - AbortSignal from the caller's AbortController timeout.
 */
export async function callJudge0(
  input: Judge0SubmissionInput,
  signal?: AbortSignal,
): Promise<Judge0Response> {
  const apiKey  = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST ?? "judge0-ce.p.rapidapi.com";

  if (!apiKey) {
    throw new Error("JUDGE0_API_KEY is not configured.");
  }

  const url = `https://${apiHost}/submissions?wait=true&base64_encoded=true`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":   "application/json",
      "X-RapidAPI-Key":  apiKey,
      "X-RapidAPI-Host": apiHost,
    },
    body:  JSON.stringify(buildJudge0Request(input)),
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Judge0 returned HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<Judge0Response>;
}
