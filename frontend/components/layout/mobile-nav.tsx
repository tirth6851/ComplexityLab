"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { NavList } from "./nav-list";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mobile navigation: a hamburger trigger (shown < lg) that opens a slide-over
 * drawer reusing the shared NavList. Closes on route selection, Escape, and
 * backdrop click; locks body scroll and traps focus while open, restoring
 * focus to the trigger on close.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current;

    // Move focus into the drawer (close button, not the full-screen
    // backdrop button); remember where it came from.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    (
      drawer?.querySelector<HTMLElement>("[data-autofocus]") ??
      drawer?.querySelector<HTMLElement>(FOCUSABLE)
    )?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Trap Tab inside the drawer.
      if (e.key === "Tab" && drawer) {
        const focusable = Array.from(
          drawer.querySelectorAll<HTMLElement>(FOCUSABLE),
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
      (previouslyFocused ?? trigger)?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div ref={drawerRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] animate-rise flex-col border-r border-border bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                type="button"
                data-autofocus
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <NavList onNavigate={() => setOpen(false)} />

            <div className="border-t border-border p-4">
              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                Free plan · early access
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
