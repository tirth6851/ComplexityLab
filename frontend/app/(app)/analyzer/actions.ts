"use server";

import { revalidatePath } from "next/cache";
import { createAnalysis } from "@/lib/db/analyses";
import { createSnippet } from "@/lib/db/snippets";
import { isLanguageId } from "@/lib/analysis/languages";
import { checkActionLimit } from "@/lib/action-limit";
import { MAX_CODE_LENGTH, SAVE_RATE_LIMIT } from "@/lib/limits";
import { logEvent } from "@/lib/log";
import { awardProgressForSave } from "@/lib/progress/award";
import type { CodeAnalysis } from "@/lib/ai/types";

export interface SaveActionResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function validate(code: unknown, language: unknown): string | null {
  if (typeof code !== "string" || code.trim().length === 0) {
    return "Nothing to save — the code buffer is empty.";
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

  // Best-effort progress award — never fails the save.
  try {
    await awardProgressForSave({ language: input.language, analysis: input.analysis });
  } catch (e) {
    logEvent("progress.error", { step: "award", error: String(e) });
  }

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

  revalidatePath("/snippets");
  revalidatePath("/dashboard");
  return { ok: true, id: res.data.id };
}
