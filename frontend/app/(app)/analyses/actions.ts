"use server";

import { revalidatePath } from "next/cache";
import { deleteAnalysis } from "@/lib/db/analyses";

export async function deleteAnalysisAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing analysis id." };
  }
  const res = await deleteAnalysis(id);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/analyses");
  revalidatePath("/dashboard");
  return { ok: true };
}
