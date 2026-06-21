"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";

/**
 * OAuth landing route. Clerk completes the Google handshake here and forwards
 * the user to /dashboard (or back to sign-in on failure).
 */
export default function SSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
      <main className="min-h-screen bg-background">
        <HoloPulseLoader label="Completing sign-in" fullScreen />
      </main>
    </>
  );
}