"use server";

import { revalidatePath } from "next/cache";
import { deleteProfileData, updateProfile } from "@/lib/db/profiles";
import { isLanguageId } from "@/lib/analysis/languages";

export interface SettingsActionResult {
  ok: boolean;
  error?: string;
}

export async function updateProfileAction(input: {
  displayName: string;
  preferredLanguage: string;
}): Promise<SettingsActionResult> {
  const displayName =
    typeof input.displayName === "string"
      ? input.displayName.trim().slice(0, 80) || null
      : null;
  const preferredLanguage =
    typeof input.preferredLanguage === "string" &&
    isLanguageId(input.preferredLanguage)
      ? input.preferredLanguage
      : "typescript";

  const res = await updateProfile({ displayName, preferredLanguage });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Danger zone: wipe the user's lab data (profile cascades to all rows). */
export async function deleteAllDataAction(): Promise<SettingsActionResult> {
  const res = await deleteProfileData();
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/dashboard");
  revalidatePath("/analyses");
  revalidatePath("/snippets");
  revalidatePath("/settings/profile");
  return { ok: true };
}
