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
 */
export function GoogleAuthButton({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    try {
      const params = {
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectCallbackUrl: "/sso-callback",
      } as const;

      if (mode === "sign-up") {
        await signUp.sso(params);
      } else {
        await signIn.sso(params);
      }
    } catch {
      // Errors surface on the Clerk resource; reset so the user can retry.
      setLoading(false);
    }
  }

  return (
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
  );
}
