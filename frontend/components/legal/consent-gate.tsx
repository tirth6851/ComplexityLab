"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const CONSENT_COOKIE = "cl-consent";
/** Bump when the privacy policy / terms materially change to re-prompt. */
const CONSENT_VERSION = "v1";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Pages that must stay readable BEFORE consent (the policies themselves). */
const EXEMPT_PATHS = ["/privacy", "/terms"];

export function hasConsent(): boolean {
  return document.cookie
    .split("; ")
    .includes(`${CONSENT_COOKIE}=${CONSENT_VERSION}`);
}

/* Tiny external store over the consent cookie so React re-reads it on accept. */
const listeners = new Set<() => void>();
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): boolean {
  return hasConsent();
}
/** During SSR/hydration assume consented; the client corrects after mount. */
function getServerSnapshot(): boolean {
  return true;
}

function storeConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=${CONSENT_VERSION}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  for (const listener of listeners) listener();
}

/**
 * Site-wide consent gate. Until the visitor accepts the Privacy Policy and
 * Terms (stored in a first-party cookie for one year), every page except the
 * legal pages is covered by a blocking dialog. Declining leaves the site.
 */
export function ConsentGate() {
  const pathname = usePathname();
  const consented = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  // Focus trap + Escape handler while dialog is visible.
  React.useEffect(() => {
    if (consented || EXEMPT_PATHS.includes(pathname)) return;
    const dialog = dialogRef.current;

    const onKey = (e: KeyboardEvent) => {
      // Consent is mandatory — Escape is intentionally not wired to a dismiss
      // action here, but we still need to intercept Tab to keep focus inside.
      if (e.key === "Tab" && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [consented, pathname]);

  if (consented || EXEMPT_PATHS.includes(pathname)) return null;

  function accept() {
    storeConsent();
  }

  function decline() {
    window.location.replace("https://www.google.com");
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[400] flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-md rounded-ds-lg border border-line bg-card p-6 shadow-ds-lg">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-ds-md bg-primary/10 text-primary">
            <FlaskConical className="h-4 w-4" aria-hidden />
          </span>
          <h2 id="consent-title" className="font-display text-xl font-semibold tracking-normal">
            Before you enter the lab
          </h2>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          ComplexityLab uses strictly functional cookies (sign-in session,
          theme, this choice) and processes the code you submit to produce
          analysis results. By continuing you accept our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          .
        </p>

        <p className="mt-2 text-xs text-ink-faint">
          No ads, no cross-site tracking, no selling data. Declining will take
          you off the site.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button autoFocus onClick={accept}>
            Accept and continue
          </Button>
          <Button variant="outline" onClick={decline}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
