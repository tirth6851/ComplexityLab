"use server";

import { revalidatePath } from "next/cache";
import { createAnalysis } from "@/lib/db/analyses";
import { createSnippet } from "@/lib/db/snippets";
import { findFunctionNames } from "@/lib/analysis/engine";
import { isLanguageId } from "@/lib/analysis/languages";
import { checkActionLimit } from "@/lib/action-limit";
import type { CodeAnalysis } from "@/lib/ai/types";

/** Per-user save budget: 20 saves per minute. */
const SAVE_LIMIT = { limit: 20, windowMs: 60_000 };

export interface SaveActionResult {
  ok: boolean;
  error?: string;
}

const MAX_CODE_LENGTH = 100_000;

/** "quickSort()" from the first declared function, else the first code line. */
function deriveTitle(code: string): string {
  const names = findFunctionNames(code);
  if (names.length > 0) return `${names[0]}()`;
  const firstLine = code.split("\n").find((l) => l.trim().length > 0);
  return (firstLine?.trim() ?? "Untitled").slice(0, 60);
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
}): Promise<SaveActionResult> {
  const limited = await checkActionLimit("save-analysis", SAVE_LIMIT);
  if (limited) return { ok: false, error: limited };

  const invalid = validate(input.code, input.language);
  if (invalid) return { ok: false, error: invalid };
  if (!input.analysis?.time?.notation || !input.analysis?.space?.notation) {
    return { ok: false, error: "Run an analysis before saving." };
  }

  const res = await createAnalysis({
    title: deriveTitle(input.code),
    language: input.language,
    code: input.code,
    analysis: input.analysis,
  });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/analyses");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveSnippetAction(input: {
  code: string;
  language: string;
  tags?: string[];
}): Promise<SaveActionResult> {
  const limited = await checkActionLimit("save-snippet", SAVE_LIMIT);
  if (limited) return { ok: false, error: limited };

  const invalid = validate(input.code, input.language);
  if (invalid) return { ok: false, error: invalid };

  const res = await createSnippet({
    title: deriveTitle(input.code),
    language: input.language,
    code: input.code,
    tags: input.tags,
  });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/snippets");
  revalidatePath("/dashboard");
  return { ok: true };
}
