"use server";

import { revalidatePath } from "next/cache";
import { deleteAnalysis } from "@/lib/db/analyses";
import { checkActionLimit } from "@/lib/action-limit";
import { DELETE_RATE_LIMIT } from "@/lib/limits";

export async function deleteAnalysisAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const limited = await checkActionLimit("delete-analysis", DELETE_RATE_LIMIT);
  if (limited) return { ok: false, error: limited };

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing analysis id." };
  }
  const res = await deleteAnalysis(id);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/analyses");
  revalidatePath("/dashboard");
  return { ok: true };
}
