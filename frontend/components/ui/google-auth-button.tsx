"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/icons";

/**
 * Google-only auth via Clerk's signals (Future) API. `useSignIn`/`useSignUp`
 * return a `signIn`/`signUp` resource; `.sso()` kicks off the OAuth redirect.
 *   - redirectCallbackUrl: in-app route that finalizes the handshake (/sso-callback)
 *   - redirectUrl: final destination once signed in (/dashboard)
 * Requires Google enabled in the Clerk Dashboard.
 *
 * NOTE: the Future `sso()` resolves with `{ error }` rather than throwing, so a
 * failed handshake must be read off the return value. Relying on try/catch
 * alone leaves the button stuck on "Redirecting to Google…" forever.
 */
export function GoogleAuthButton({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      const params = {
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectCallbackUrl: "/sso-callback",
      } as const;

      const { error: ssoError } =
        mode === "sign-up"
          ? await signUp.sso(params)
          : await signIn.sso(params);

      // On success the browser redirects to Google before this resolves; if we
      // get here with an error, the redirect never happened — surface it and
      // reset so the user isn't stuck on the loading state.
      if (ssoError) {
        setError(
          ssoError.longMessage ??
            ssoError.message ??
            "Couldn’t start Google sign-in. Please try again.",
        );
        setLoading(false);
      }
    } catch {
      // Unexpected throw (e.g. network failure before the redirect). Reset so
      // the user can retry.
      setError("Couldn’t start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={handleGoogle}
      >
        <GoogleIcon className="h-4 w-4" />
        {loading ? "Redirecting to Google…" : "Continue with Google"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
