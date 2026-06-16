/**
 * Integration tests for settings Server Actions.
 *
 * Covers updateProfileAction and deleteAllDataAction — both untested (P1-6 gap).
 *
 * updateProfileAction: trims/caps displayName, validates + falls back for
 * preferredLanguage, rate-limits at 10/min, surfaces DB failures.
 *
 * deleteAllDataAction: the danger-zone action (rate-limited 3/hour) that
 * cascades-deletes the entire user's data. Asserts the rate-limit guard fires,
 * DB failures surface, and success revalidates all four affected paths.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// ── Module mocks (hoisted by Vitest before any import) ────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/action-limit", () => ({
  checkActionLimit: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  updateProfile: vi.fn(),
  deleteProfileData: vi.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { revalidatePath } from "next/cache";
import { checkActionLimit } from "@/lib/action-limit";
import { updateProfile, deleteProfileData } from "@/lib/db/profiles";
import {
  updateProfileAction,
  deleteAllDataAction,
} from "@/app/(app)/settings/actions";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeProfile = {
  id: "profile-1",
  clerkUserId: "clerk_user_1",
  displayName: "Alice",
  preferredLanguage: "typescript" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

// ── Setup ─────────────────────────────────────────────────────────────────────

const mockedCheckActionLimit = checkActionLimit as Mock;
const mockedUpdateProfile = updateProfile as Mock;
const mockedDeleteProfileData = deleteProfileData as Mock;
const mockedRevalidatePath = revalidatePath as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: not rate-limited.
  mockedCheckActionLimit.mockResolvedValue(null);
});

// ════════════════════════════════════════════════════════════════════════════
// updateProfileAction
// ════════════════════════════════════════════════════════════════════════════

describe("updateProfileAction", () => {
  it("returns the rate-limit error without calling updateProfile", async () => {
    mockedCheckActionLimit.mockResolvedValue(
      "Slow down — too many requests. Try again in 10s.",
    );

    const result = await updateProfileAction({
      displayName: "Alice",
      preferredLanguage: "typescript",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/slow down/i);
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
  });

  it("trims and caps displayName at 80 characters", async () => {
    mockedUpdateProfile.mockResolvedValue({ ok: true, data: fakeProfile });

    await updateProfileAction({
      displayName: "  " + "x".repeat(100) + "  ",
      preferredLanguage: "typescript",
    });

    expect(mockedUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "x".repeat(80),
      }),
    );
  });

  it("converts a blank displayName to null", async () => {
    mockedUpdateProfile.mockResolvedValue({ ok: true, data: fakeProfile });

    await updateProfileAction({
      displayName: "   ",
      preferredLanguage: "typescript",
    });

    expect(mockedUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: null }),
    );
  });

  it("falls back to typescript for an unrecognised preferredLanguage", async () => {
    mockedUpdateProfile.mockResolvedValue({ ok: true, data: fakeProfile });

    await updateProfileAction({
      displayName: "Alice",
      preferredLanguage: "cobol",
    });

    expect(mockedUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ preferredLanguage: "typescript" }),
    );
  });

  it("accepts every known language id without falling back", async () => {
    mockedUpdateProfile.mockResolvedValue({ ok: true, data: fakeProfile });

    for (const lang of ["typescript", "javascript", "python", "java", "go", "rust", "cpp"]) {
      await updateProfileAction({ displayName: "Alice", preferredLanguage: lang });
      expect(mockedUpdateProfile).toHaveBeenLastCalledWith(
        expect.objectContaining({ preferredLanguage: lang }),
      );
    }
  });

  it("revalidates /settings/profile and /dashboard on success", async () => {
    mockedUpdateProfile.mockResolvedValue({ ok: true, data: fakeProfile });

    const result = await updateProfileAction({
      displayName: "Alice",
      preferredLanguage: "python",
    });

    expect(result.ok).toBe(true);
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/settings/profile");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("surfaces a database failure without revalidating", async () => {
    mockedUpdateProfile.mockResolvedValue({
      ok: false,
      error: "Could not update your profile.",
    });

    const result = await updateProfileAction({
      displayName: "Alice",
      preferredLanguage: "typescript",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Could not update your profile.");
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// deleteAllDataAction
// ════════════════════════════════════════════════════════════════════════════

describe("deleteAllDataAction", () => {
  it("returns the rate-limit error without calling deleteProfileData", async () => {
    mockedCheckActionLimit.mockResolvedValue(
      "Slow down — too many requests. Try again in 3600s.",
    );

    const result = await deleteAllDataAction();

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/slow down/i);
    expect(mockedDeleteProfileData).not.toHaveBeenCalled();
  });

  it("calls deleteProfileData and revalidates all four affected paths on success", async () => {
    mockedDeleteProfileData.mockResolvedValue({ ok: true, data: null });

    const result = await deleteAllDataAction();

    expect(result.ok).toBe(true);
    expect(mockedDeleteProfileData).toHaveBeenCalledOnce();
    // All downstream caches must be purged so the user lands on clean empty states.
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/analyses");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/snippets");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/settings/profile");
  });

  it("surfaces a database failure without revalidating", async () => {
    mockedDeleteProfileData.mockResolvedValue({
      ok: false,
      error: "Could not delete your data.",
    });

    const result = await deleteAllDataAction();

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Could not delete your data.");
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});
