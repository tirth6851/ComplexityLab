"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dependency-free theme toggle. The active class is set pre-hydration by the
 * inline script in app/layout.tsx; this control reads the live class at click
 * time, flips it, and persists the choice — so it needs no React state and
 * stays in sync even if the class changes elsewhere. CSS swaps the icon based
 * on the `.dark` class, keeping SSR markup stable.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable (private mode) — toggle still applies for the session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Both icons rendered; CSS shows the relevant one so SSR markup is stable. */}
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
      <Moon className="block h-4 w-4 dark:hidden" aria-hidden />
      <span className="sr-only">Toggle between light and dark theme</span>
    </button>
  );
}
