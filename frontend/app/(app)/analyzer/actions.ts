"use server";

/**
 * Server Actions for the analyzer page.
 *
 * "use server" marks this file so Next.js treats every exported async function
 * as a Server Action — callable from Client Components via a secure POST to a
 * Next.js internal endpoint, never exposed as a public API route.
 *
 * Pattern used here:
 *   1. checkActionLimit()  — rate limit + auth check (must be first)
 *   2. validate()          — reject bad input before touching the DB
 *   3. DB write            — the main operation; if this fails, we return early
 *   4. awardProgress()     — best-effort side effect; failure never rolls back the save
 *   5. revalidatePath()    — tells Next to invalidate the page cache for affected routes
 */

import { revalidatePath } from "next/cache";
import { createAnalysis } from "@/lib/db/analyses";
import { createSnippet } from "@/lib/db/snippets";
import { isLanguageId } from "@/lib/analysis/languages";
import { checkActionLimit } from "@/lib/action-limit";
import { MAX_CODE_LENGTH, SAVE_RATE_LIMIT } from "@/lib/limits";
import { logEvent } from "@/lib/log";
import { awardProgressForSave, awardProgressForSnippet } from "@/lib/progress/award";
import type { CodeAnalysis } from "@/lib/ai/types";

export interface SaveActionResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function validate(code: unknown, language: unknown): string | null {
  if (typeof code !== "string" || code.trim().length === 0) {
    return "Nothing to save â€” the code buffer is empty.";
  }
  if (code.length > MAX_CODE_LENGTH) return "Code is too large to save.";
  if (typeof language !== "string" || !isLanguageId(language)) {
    return "Unsupported language.";
  }
  return null;
}

export async function saveAnalysisAction(input: {
  code: string;
  language: string;
  analysis: CodeAnalysis;
  title: string;
}): Promise<SaveActionResult> {
  const limited = await checkActionLimit("save-analysis", SAVE_RATE_LIMIT);
  if (limited) return { ok: false, error: limited };

  const invalid = validate(input.code, input.language);
  if (invalid) return { ok: false, error: invalid };
  if (!input.analysis?.time?.notation || !input.analysis?.space?.notation) {
    return { ok: false, error: "Run an analysis before saving." };
  }
  if (!input.title?.trim()) {
    return { ok: false, error: "A title is required." };
  }

  const res = await createAnalysis({
    title: input.title,
    language: input.language,
    code: input.code,
    analysis: input.analysis,
  });
  if (!res.ok) return { ok: false, error: res.error };

  // Best-effort progress award â€” never fails the save.
  try {
    await awardProgressForSave({ language: input.language, analysis: input.analysis });
  } catch (e) {
    logEvent("progress.error", { step: "award", error: String(e) });
  }

  // Bust the Next.js page cache so the new analysis appears immediately on
  // the /analyses list and the dashboard's recent-analyses widget.
  revalidatePath("/analyses");
  revalidatePath("/dashboard");
  return { ok: true, id: res.data.id };
}

export async function saveSnippetAction(input: {
  code: string;
  language: string;
  title: string;
  tags?: string[];
}): Promise<SaveActionResult> {
  const limited = await checkActionLimit("save-snippet", SAVE_RATE_LIMIT);
  if (limited) return { ok: false, error: limited };

  const invalid = validate(input.code, input.language);
  if (invalid) return { ok: false, error: invalid };
  if (!input.title?.trim()) {
    return { ok: false, error: "A title is required." };
  }

  const res = await createSnippet({
    title: input.title,
    language: input.language,
    code: input.code,
    tags: input.tags,
  });
  if (!res.ok) return { ok: false, error: res.error };

  // Best-effort progress award - never fails the save.
  try {
    await awardProgressForSnippet({ language: input.language });
  } catch (e) {
    logEvent("progress.error", { step: "snippet-award", error: String(e) });
  }

  revalidatePath("/snippets");
  revalidatePath("/dashboard");
  return { ok: true, id: res.data.id };
}
