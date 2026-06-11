"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteAnalysis } from "@/lib/db/analyses";
import { checkActionLimit } from "@/lib/action-limit";

/** Delete an analysis and redirect to the analyses list. */
export async function deleteAnalysisAndRedirectAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const limited = await checkActionLimit("delete-analysis", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return { ok: false, error: limited };

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing analysis id." };
  }
  const res = await deleteAnalysis(id);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/analyses");
  revalidatePath("/dashboard");
  redirect("/analyses");
}
