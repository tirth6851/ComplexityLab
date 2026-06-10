import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAnalysisProvider } from "@/lib/ai";
import { isLanguageId } from "@/lib/analysis/languages";
import { logEvent } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";

/** Hard cap on submitted source size (chars). */
const MAX_CODE_LENGTH = 100_000;

/** Per-user analysis budget: 20 runs per minute. */
const ANALYZE_LIMIT = { limit: 20, windowMs: 60_000 };

/**
 * POST /api/analyze — run a complexity analysis through the active provider.
 * Auth-required; rate-limited per user; validates input before the provider.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to analyze code." }, { status: 401 });
  }

  const limit = rateLimit(`analyze:${userId}`, ANALYZE_LIMIT);
  if (!limit.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
    logEvent("analyze.rate_limited", { userId, retryAfterSec });
    return NextResponse.json(
      { error: `Too many analyses — try again in ${retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": `${retryAfterSec}` } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { code, language } = (body ?? {}) as { code?: unknown; language?: unknown };

  if (typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Provide some code to analyze." }, { status: 400 });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return NextResponse.json(
      { error: `Code is too large (max ${MAX_CODE_LENGTH.toLocaleString()} characters).` },
      { status: 413 },
    );
  }
  if (typeof language !== "string" || !isLanguageId(language)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  const startedAt = Date.now();
  try {
    const provider = getAnalysisProvider();
    const analysis = await provider.analyze({ code, language });
    // Metadata only — submitted code is never logged.
    logEvent("analyze.complete", {
      userId,
      language,
      chars: code.length,
      ms: Date.now() - startedAt,
      time: analysis.time.notation,
      space: analysis.space.notation,
      provider: analysis.provider,
      confidence: analysis.confidence,
    });
    return NextResponse.json({ analysis });
  } catch (e) {
    logEvent("analyze.error", {
      userId,
      language,
      chars: code.length,
      ms: Date.now() - startedAt,
      message: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json(
      { error: "The analysis engine hit an unexpected error. Try again." },
      { status: 500 },
    );
  }
}
