"use server";

import { revalidatePath } from "next/cache";
import { deleteSnippet } from "@/lib/db/snippets";
import { checkActionLimit } from "@/lib/action-limit";

export async function deleteSnippetAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const limited = await checkActionLimit("delete-snippet", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return { ok: false, error: limited };

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing snippet id." };
  }
  const res = await deleteSnippet(id);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/snippets");
  revalidatePath("/dashboard");
  return { ok: true };
}
