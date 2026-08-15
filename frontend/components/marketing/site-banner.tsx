"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "cl-banner-dismissed-v1";
/** Bump the key's version suffix when the announcement changes so returning
 *  visitors who dismissed the old one see the new one. */
const DISMISSED_VALUE = "1";

/**
 * Path prefixes for the authenticated app shell (mirrors proxy.ts
 * PROTECTED_ROUTES). Duplicated rather than imported: proxy.ts pulls in
 * @clerk/nextjs/server, which is server-only and would break the client
 * bundle if imported here.
 */
const APP_PATH_PREFIXES = [
  "/dashboard",
  "/analyzer",
  "/analyses",
  "/snippets",
  "/playground",
  "/progress",
  "/settings",
  "/chat",
  "/learning",
] as const;

function isAppRoute(pathname: string): boolean {
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/* Tiny external store over the dismissal flag (same pattern as the analyzer
   intro strip / consent gate) — re-renders subscribers on dismiss without
   setState-in-effect. */
const listeners = new Set<() => void>();
/** In-memory fallback so dismissing still works when storage is unavailable. */
let sessionDismissed = false;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): boolean {
  if (sessionDismissed) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== DISMISSED_VALUE;
  } catch {
    return true;
  }
}
/** Hidden during SSR/hydration; the client reveals it once mounted. */
function getServerSnapshot(): boolean {
  return false;
}
function dismissBanner(): void {
  sessionDismissed = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, DISMISSED_VALUE);
  } catch {
    // Private mode etc. — the in-memory flag still hides it for this visit.
  }
  for (const listener of listeners) listener();
}

/**
 * Thin, dismissible announcement bar for public/marketing pages only. Never
 * rendered inside the authenticated app shell (dashboard, analyzer, etc.) —
 * those routes get the workspace chrome instead.
 */
export function SiteBanner() {
  const pathname = usePathname();
  const visible = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!visible || isAppRoute(pathname)) return null;

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="relative flex w-full items-start gap-3 border-b border-line bg-primary/10 py-2.5 pl-4 pr-11 text-sm text-ink-primary transition-colors sm:items-center sm:justify-center sm:text-center"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" aria-hidden />
      {/* Truncating to one line only above `sm`: at phone widths the message
          + "Explore →" CTA don't reliably fit on one line, and a `truncate`
          ellipsis was silently clipping the CTA off-screen — confirmed on a
          390px real-device viewport before this fix. Wrapping to 2 lines on
          mobile keeps the actual link visible instead of hidden. */}
      <p className="min-w-0 sm:truncate">
        <span className="font-semibold">New:</span> guides, algorithm
        walkthroughs, and a cheat sheet are live —{" "}
        <Link
          href="/complexity-cheatsheet"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Explore
          <span aria-hidden> →</span>
        </Link>
      </p>
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Dismiss announcement"
        className="absolute right-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-ds-sm text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
