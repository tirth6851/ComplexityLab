import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAnalysisProvider } from "@/lib/ai";
import { isLanguageId } from "@/lib/analysis/languages";

/** Hard cap on submitted source size (chars). */
const MAX_CODE_LENGTH = 100_000;

/**
 * POST /api/analyze — run a complexity analysis through the active provider.
 * Auth-required; validates input shape before touching the provider.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to analyze code." }, { status: 401 });
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

  try {
    const provider = getAnalysisProvider();
    const analysis = await provider.analyze({ code, language });
    return NextResponse.json({ analysis });
  } catch (e) {
    console.error("analyze failed:", e);
    return NextResponse.json(
      { error: "The analysis engine hit an unexpected error. Try again." },
      { status: 500 },
    );
  }
}
