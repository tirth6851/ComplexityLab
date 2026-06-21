"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
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
 * alone leaves the button stuck on "Redirecting to Google..." forever.
 */
export function GoogleAuthButton({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

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
      // get here with an error, the redirect never happened - surface it and
      // reset so the user isn't stuck on the loading state.
      if (ssoError) {
        setError(
          ssoError.longMessage ??
            ssoError.message ??
            "Couldn't start Google sign-in. Please try again.",
        );
        setLoading(false);
      }
    } catch {
      // Unexpected throw (e.g. network failure before the redirect). Reset so
      // the user can retry.
      setError("Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <motion.div
        whileHover={loading || reduceMotion ? undefined : { y: -1 }}
        whileTap={loading || reduceMotion ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="group relative w-full overflow-hidden border-line-subtle bg-card/55 shadow-[0_16px_34px_-28px_rgba(34,211,238,0.7)] hover:border-primary/40 hover:bg-surface-raised hover:shadow-[0_18px_38px_-28px_rgba(0,229,153,0.85)] focus-visible:ring-primary/55"
          disabled={loading}
          onClick={handleGoogle}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-cyan-300/8 to-teal-300/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span
                key="loading"
                className="relative inline-flex items-center gap-2"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                <HoloPulseLoader
                  label="Redirecting to Google"
                  size="sm"
                  className="w-auto [&>p]:sr-only"
                />
                Redirecting to Google…
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                className="relative inline-flex items-center gap-2"
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                <GoogleIcon className="h-4 w-4 transition-transform duration-150 group-hover:scale-105" />
                Continue with Google
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
      {error ? (
        <motion.p
          className="text-sm text-destructive"
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      ) : null}
    </div>
  );
}