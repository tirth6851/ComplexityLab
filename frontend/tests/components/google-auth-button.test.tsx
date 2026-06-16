/**
 * Unit tests for GoogleAuthButton — covers the AUTH-04 regression.
 *
 * The key invariant: Clerk's `sso()` resolves with `{ error }` on failure rather
 * than throwing. A try/catch-only implementation would leave the button stuck on
 * "Redirecting to Google…" forever. These tests assert that both the resolved-
 * error path AND the thrown-error path always reset loading and surface the error
 * in a `role="alert"` element so assistive tech picks it up.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSignIn, useSignUp } from "@clerk/nextjs";

vi.mock("@clerk/nextjs", () => ({
  useSignIn: vi.fn(),
  useSignUp: vi.fn(),
}));

import { GoogleAuthButton } from "@/components/ui/google-auth-button";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSignInSso = vi.fn();
const mockSignUpSso = vi.fn();

const mockedUseSignIn = useSignIn as Mock;
const mockedUseSignUp = useSignUp as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseSignIn.mockReturnValue({ signIn: { sso: mockSignInSso } });
  mockedUseSignUp.mockReturnValue({ signUp: { sso: mockSignUpSso } });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GoogleAuthButton — idle state", () => {
  it("renders the idle button with no error", () => {
    mockSignInSso.mockResolvedValue({});
    render(<GoogleAuthButton mode="sign-in" />);

    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).not.toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("GoogleAuthButton — loading state", () => {
  it("disables the button and shows loading text while sso() is in flight", async () => {
    let resolveSso!: (v: { error?: unknown }) => void;
    mockSignInSso.mockReturnValue(new Promise<{ error?: unknown }>(r => { resolveSso = r; }));

    const user = userEvent.setup();
    render(<GoogleAuthButton mode="sign-in" />);

    // Fire the click but don't await completion — the handler suspends at the sso() call.
    void user.click(screen.getByRole("button", { name: /continue with google/i }));

    // setLoading(true) fires before the await, so the button should flip.
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("Redirecting to Google…");
      expect(screen.getByRole("button")).toBeDisabled();
    });

    // Resolve so the component can clean up.
    resolveSso({});
  });
});

describe("GoogleAuthButton — error paths (AUTH-04 regression)", () => {
  it("resets loading and shows role=alert when sso() resolves with { error.longMessage }", async () => {
    // Clerk's Future sso() resolves — not throws — on error. The component must
    // read `result.error` explicitly; try/catch alone misses this path.
    mockSignInSso.mockResolvedValue({
      error: { longMessage: "OAuth handshake failed.", message: "short" },
    });

    const user = userEvent.setup();
    render(<GoogleAuthButton mode="sign-in" />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("OAuth handshake failed.");
    });
    // Button must be re-enabled so the user can retry.
    expect(screen.getByRole("button", { name: /continue with google/i })).not.toBeDisabled();
  });

  it("falls back to error.message when longMessage is absent", async () => {
    mockSignInSso.mockResolvedValue({
      error: { message: "Provider unavailable." },
    });

    const user = userEvent.setup();
    render(<GoogleAuthButton mode="sign-in" />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Provider unavailable.");
    });
  });

  it("shows the generic fallback when both longMessage and message are absent", async () => {
    mockSignInSso.mockResolvedValue({ error: {} });

    const user = userEvent.setup();
    render(<GoogleAuthButton mode="sign-in" />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("start Google sign-in");
    });
  });

  it("resets loading and shows role=alert when sso() throws unexpectedly", async () => {
    mockSignInSso.mockRejectedValue(new Error("Network failure"));

    const user = userEvent.setup();
    render(<GoogleAuthButton mode="sign-in" />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("start Google sign-in");
    });
    expect(screen.getByRole("button", { name: /continue with google/i })).not.toBeDisabled();
  });
});

describe("GoogleAuthButton — sign-up mode", () => {
  it("calls signUp.sso() — not signIn.sso() — in sign-up mode", async () => {
    mockSignUpSso.mockResolvedValue({});

    const user = userEvent.setup();
    render(<GoogleAuthButton mode="sign-up" />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => expect(mockSignUpSso).toHaveBeenCalledOnce());
    expect(mockSignInSso).not.toHaveBeenCalled();
    expect(mockSignUpSso).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: "oauth_google" }),
    );
  });
});
