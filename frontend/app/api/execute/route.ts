import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logEvent } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";
import {
  EXECUTE_RATE_LIMIT,
  EXECUTE_DAILY_QUOTA,
  MAX_EXEC_CODE_LENGTH,
  MAX_EXEC_STDIN_LENGTH,
} from "@/lib/limits";
import { isExecutable, JUDGE0_LANGUAGES } from "@/lib/execute/languages";
import { callJudge0, normalizeResult } from "@/lib/execute/judge0";
import { countExecutionsToday, recordExecution } from "@/lib/db/executions";
import type { ExecutionResult } from "@/lib/execute/types";

/**
 * Vercel function timeout. Must exceed Judge0 wall_time_limit (8 s) plus
 * network round-trip margin. Set to 15 s to give ~6 s of headroom.
 */
export const maxDuration = 15;

/**
 * POST /api/execute — proxy user code to Judge0 CE and return the result.
 *
 * Pipeline:
 *   1. auth()                     → 401 if signed out
 *   2. rateLimit (in-memory)      → 429 if > 10/min (burst guard)
 *   3. countExecutionsToday (DB)  → 429 if daily quota reached
 *   4. validate body              → 400/413 on bad input
 *   5. callJudge0 (12 s timeout)  → 200 { result } on success or service error
 *   6. recordExecution (DB)       → best-effort metadata insert (never blocks response)
 *
 * Privacy: code, stdin, and stdout are NEVER logged or persisted. Only
 * execution metadata (language, status, timing) is recorded.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to run code." }, { status: 401 });
  }

  // ── 1. Per-minute burst guard (in-memory, per warm instance) ──────────────
  const limit = rateLimit(`execute:${userId}`, EXECUTE_RATE_LIMIT);
  if (!limit.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    logEvent("execute.rate_limited", { userId, retryAfterSec });
    return NextResponse.json(
      { error: `Too many executions — try again in ${retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": `${retryAfterSec}` } },
    );
  }

  // ── 2. Daily quota guard (DB-backed) ──────────────────────────────────────
  // In-memory limits cannot enforce per-day caps across serverless instances.
  // On quota-check failure we degrade gracefully: allow the execution and log.
  const quotaResult = await countExecutionsToday();
  if (!quotaResult.ok) {
    logEvent("execute.quota_check_failed", { userId, error: quotaResult.error });
  } else if (quotaResult.data >= EXECUTE_DAILY_QUOTA) {
    logEvent("execute.daily_quota_reached", { userId, count: quotaResult.data });
    return NextResponse.json(
      {
        error: `Daily execution limit reached (${EXECUTE_DAILY_QUOTA} runs). Resets at midnight UTC.`,
      },
      { status: 429 },
    );
  }

  // ── 3. Parse and validate request body ────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    code,
    language,
    stdin = "",
  } = (body ?? {}) as {
    code?: unknown;
    language?: unknown;
    stdin?: unknown;
  };

  if (typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Provide some code to run." }, { status: 400 });
  }
  if (code.length > MAX_EXEC_CODE_LENGTH) {
    return NextResponse.json(
      { error: `Code is too large (max ${MAX_EXEC_CODE_LENGTH.toLocaleString()} characters).` },
      { status: 413 },
    );
  }
  if (typeof language !== "string" || !isExecutable(language)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }
  const stdinStr = typeof stdin === "string" ? stdin : "";
  if (stdinStr.length > MAX_EXEC_STDIN_LENGTH) {
    return NextResponse.json(
      {
        error: `stdin is too large (max ${MAX_EXEC_STDIN_LENGTH.toLocaleString()} characters).`,
      },
      { status: 400 },
    );
  }

  const languageId = JUDGE0_LANGUAGES[language]!;
  const startedAt = Date.now();

  // ── 4. Call Judge0 with a hard 12 s abort timeout ─────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);

  let result: ExecutionResult;
  try {
    const raw = await callJudge0(
      { languageId, code, stdin: stdinStr },
      controller.signal,
    );
    result = normalizeResult(raw);
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    logEvent("execute.error", {
      userId,
      language,
      ms: Date.now() - startedAt,
      reason: isAbort ? "timeout" : (e instanceof Error ? e.message : "unknown"),
    });
    // No local execution fallback — return a clean error state (same ethos as Groq fallback)
    return NextResponse.json({
      result: {
        status:        "error",
        statusLabel:   "Execution service unavailable",
        stdout:        null,
        stderr:        null,
        compileOutput: null,
        timeMs:        null,
        memoryKb:      null,
      } satisfies ExecutionResult,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // ── 5. Record metadata (best-effort — never blocks the response) ───────────
  const recordResult = await recordExecution({
    language,
    status:   result.status,
    timeMs:   result.timeMs,
    memoryKb: result.memoryKb,
  });
  if (!recordResult.ok) {
    logEvent("execute.record_failed", { userId, error: recordResult.error });
  }

  logEvent("execute.complete", {
    userId,
    language,
    status:   result.status,
    ms:       Date.now() - startedAt,
    timeMs:   result.timeMs,
    memoryKb: result.memoryKb,
  });

  return NextResponse.json({ result });
}
