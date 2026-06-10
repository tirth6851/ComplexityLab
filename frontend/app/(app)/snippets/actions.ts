"use server";

import { revalidatePath } from "next/cache";
import { deleteSnippet } from "@/lib/db/snippets";

export async function deleteSnippetAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing snippet id." };
  }
  const res = await deleteSnippet(id);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/snippets");
  revalidatePath("/dashboard");
  return { ok: true };
}
