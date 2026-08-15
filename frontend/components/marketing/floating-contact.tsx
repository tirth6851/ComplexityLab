"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Must stay equal to the CONTACT_EMAIL constant defined independently in
 * app/privacy/page.tsx, app/terms/page.tsx, and app/about/page.tsx. Not
 * imported from a shared module because those pages also surface a second
 * team inbox (TEAM_CONTACT_EMAIL) that this bubble intentionally omits to
 * keep the panel to one, unambiguous call to action.
 */
const CONTACT_EMAIL = "tirth2093@gmail.com";

/**
 * Authenticated-app path prefixes, mirroring PROTECTED_ROUTES in proxy.ts.
 * Duplicated by hand (not imported) because proxy.ts pulls in
 * @clerk/nextjs/server, which is server-only and would break this client
 * component's bundle. Keep in sync with proxy.ts when routes change.
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

function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Site-wide "contact us" bubble for public/marketing pages only — the
 * authenticated app already has an AI Chat feature, so this would be
 * redundant there (see isAppRoute).
 *
 * Positioning: bottom-left (`bottom-6 left-6`). A "back to top" control is
 * being added independently and is likely to claim bottom-right, so this
 * button deliberately sits on the opposite corner to avoid overlap. If that
 * button ends up elsewhere, this is the one place to change (the `fixed
 * bottom-6 left-6` on the outer wrapper below).
 */
export function FloatingContact() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const onAppRoute = isAppRoute(pathname);

  // Focus management: move focus into the panel on open, trap Tab while
  // open, close on Escape or an outside click, and restore focus to the
  // trigger when the panel closes (mirrors components/ui/dialog.tsx).
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panel?.contains(target) || trigger?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      (previouslyFocused ?? trigger)?.focus();
    };
  }, [open]);

  // Rendering null below (rather than an extra effect that calls setOpen)
  // is enough: it takes the panel out of the DOM immediately on navigation
  // into the app shell, and the effect above only attaches its listeners
  // while `open` is true, so nothing is left dangling.
  if (onAppRoute) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={headingId}
          className="absolute bottom-16 left-0 w-72 rounded-ds-xl border border-line-subtle bg-card/95 p-5 shadow-ds-xl backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <h2
              id={headingId}
              className="font-display text-base font-semibold tracking-normal text-foreground"
            >
              Questions or feedback?
            </h2>
            <button
              type="button"
              aria-label="Close contact panel"
              onClick={() => setOpen(false)}
              className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            Reach the ComplexityLab team directly — we read every message.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-ds-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-ds-sm transition-all hover:brightness-110 hover:shadow-glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {CONTACT_EMAIL}
            </a>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-ds-md border border-line-subtle px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              More about us
            </Link>
          </div>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Contact us"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-ds-xl transition-all duration-150 ease-ds hover:brightness-110 hover:shadow-glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open && "brightness-110",
        )}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <MessageCircle className="h-5 w-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
