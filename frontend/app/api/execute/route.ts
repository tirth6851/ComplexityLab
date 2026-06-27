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
import { countExecutionsToday, countAllExecutionsToday, recordExecution } from "@/lib/db/executions";
import { awardProgressForExecution } from "@/lib/progress/award";
import type { ExecutionResult } from "@/lib/execute/types";

/**
 * Vercel function timeout. Must exceed Judge0 wall_time_limit (8 s) plus
 * network round-trip margin. Set to 15 s to give ~6 s of headroom.
 */
export const maxDuration = 15;

/**
<<<<<<< Updated upstream
 * POST /api/execute — proxy user code to Judge0 CE and return the result.
 *
 * Pipeline:
 *   1. auth()                          → 401 if signed out
 *   2. config guard                    → 503 if JUDGE0_API_KEY is not set
 *   3. emergency disable               → 503 if JUDGE0_ENABLED=false
 *   4. global cap (JUDGE0_GLOBAL_DAILY_CAP, DB) → 503 if cross-user daily cap reached
 *   5. rateLimit (in-memory)           → 429 if > 10/min (burst guard)
 *   6. countExecutionsToday (DB)       → 429 if per-user daily quota reached
 *   7. validate body                   → 400/413 on bad input
 *   8. callJudge0 (12 s timeout)       → 200 { result } on success or service error
 *   9. recordExecution (DB)            → best-effort metadata insert (never blocks response)
 *  10. awardProgressForExecution       → best-effort XP award (never blocks response)
=======
 * POST /api/execute - proxy user code to Judge0 CE and return the result.
 *
 * Pipeline:
 *   1. auth()                     -> 401 if signed out
 *   2. rateLimit (in-memory)      -> 429 if > 10/min (burst guard)
 *   3. countExecutionsToday (DB)  -> 429 if daily quota reached
 *   4. validate body              -> 400/413 on bad input
 *   5. callJudge0 (12 s timeout)  -> 200 { result } on success or service error
 *   6. recordExecution (DB)       -> best-effort metadata insert (never blocks response)
>>>>>>> Stashed changes
 *
 * Privacy: code, stdin, and stdout are NEVER logged or persisted. Only
 * execution metadata (language, status, timing) is recorded.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to run code." }, { status: 401 });
  }

<<<<<<< Updated upstream
  // ── Configuration guard ────────────────────────────────────────────────────
  // Fail fast before consuming rate-limit tokens when the service is not set up.
  if (!process.env.JUDGE0_API_KEY) {
    logEvent("execute.not_configured", { userId });
    return NextResponse.json(
      { error: "Code execution is not available right now. Please try again later." },
      { status: 503 },
    );
  }

  // ── Emergency disable ──────────────────────────────────────────────────────
  // Set JUDGE0_ENABLED=false to instantly pause all execution without redeployment.
  if (process.env.JUDGE0_ENABLED === "false") {
    logEvent("execute.disabled", { userId });
    return NextResponse.json(
      { error: "Code execution is temporarily disabled. Please try again later." },
      { status: 503 },
    );
  }

  // ── Global daily cap (cross-user billing protection) ──────────────────────
  // Only enforced when JUDGE0_GLOBAL_DAILY_CAP is explicitly set. Default safe
  // value is 900 (~$0.90 overage after the 500 free daily requests on RapidAPI).
  // Fails open on DB error so a missing migration doesn't break execution.
  const globalCapEnv = process.env.JUDGE0_GLOBAL_DAILY_CAP;
  if (globalCapEnv != null) {
    const globalCap = parseInt(globalCapEnv, 10);
    if (!Number.isFinite(globalCap)) {
      // Non-numeric value: log so operators notice the misconfiguration, then skip.
      logEvent("execute.global_cap_invalid", { userId, value: globalCapEnv });
    } else if (globalCap > 0) {
      // Positive cap: enforce it. globalCap === 0 is a valid "disabled" signal — no check.
      const globalCount = await countAllExecutionsToday();
      if (!globalCount.ok) {
        logEvent("execute.global_cap_check_failed", { userId, error: globalCount.error });
        // Fail-open: allow the execution; log loudly for operator visibility.
      } else if (globalCount.data >= globalCap) {
        logEvent("execute.global_cap_reached", {
          userId,
          globalCount: globalCount.data,
          globalCap,
        });
        return NextResponse.json(
          { error: "Code execution is temporarily unavailable. Please try again tomorrow." },
          { status: 503 },
        );
      }
    }
  }

  // ── 1. Per-minute burst guard (in-memory, per warm instance) ──────────────
=======
  // -- 1. Per-minute burst guard (in-memory, per warm instance) --------------
>>>>>>> Stashed changes
  const limit = rateLimit(`execute:${userId}`, EXECUTE_RATE_LIMIT);
  if (!limit.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    logEvent("execute.rate_limited", { userId, retryAfterSec });
    return NextResponse.json(
<<<<<<< Updated upstream
      { error: `Too many executions — try again in ${retryAfterSec}s.` },
=======
      { error: `Too many executions - try again in ${retryAfterSec}s.` },
>>>>>>> Stashed changes
      { status: 429, headers: { "Retry-After": `${retryAfterSec}` } },
    );
  }

<<<<<<< Updated upstream
  // ── 2. Daily quota guard (DB-backed) ──────────────────────────────────────
=======
  // -- 2. Daily quota guard (DB-backed) --------------------------------------
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // ── 3. Parse and validate request body ────────────────────────────────────
=======
  // -- 3. Parse and validate request body ------------------------------------
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // ── 4. Call Judge0 with a hard 12 s abort timeout ─────────────────────────
=======
  // -- 4. Call Judge0 with a hard 12 s abort timeout -------------------------
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    // No local execution fallback — return a clean error state (same ethos as Groq fallback)
=======
    // No local execution fallback - return a clean error state (same ethos as Groq fallback)
>>>>>>> Stashed changes
    return NextResponse.json({
      result: {
        status:        "error",
        statusLabel:   isAbort ? "Execution timed out" : "Execution service unavailable",
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

<<<<<<< Updated upstream
  // ── 5. Record metadata (best-effort — never blocks the response) ───────────
=======
  // -- 5. Record metadata (best-effort - never blocks the response) -----------
>>>>>>> Stashed changes
  const recordResult = await recordExecution({
    language,
    status:   result.status,
    timeMs:   result.timeMs,
    memoryKb: result.memoryKb,
  });
  if (!recordResult.ok) {
    logEvent("execute.record_failed", { userId, error: recordResult.error });
  }

  // ── 6. Award XP for successful execution (best-effort) ────────────────────
  try {
    await awardProgressForExecution({ language, status: result.status });
  } catch (e) {
    logEvent("progress.error", { step: "execution-award", error: String(e) });
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
