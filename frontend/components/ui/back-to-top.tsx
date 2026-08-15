"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Reveal only once the reader has scrolled roughly a full viewport down. */
const SCROLL_THRESHOLD_PX = 400;

export interface BackToTopProps {
  className?: string;
}

/**
 * Site-wide floating "back to top" control. Mount once per layout — it reads
 * `window.scrollY` itself, so it works correctly no matter which page it's on.
 *
 * Scroll position is sampled via rAF rather than in the scroll handler directly:
 * scroll fires far faster than the browser paints, so committing React state on
 * every event would schedule redundant renders. The rAF gate collapses a whole
 * burst of scroll events into at most one state update per frame.
 */
export function BackToTop({ className }: BackToTopProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let ticking = false;

    function measure() {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(measure);
    }

    onScroll(); // sync with current scroll position (e.g. after a reload mid-page)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    // Respect the reader's OS-level motion preference rather than forcing an
    // animated scroll on them.
    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-6 right-6 z-[200] inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink-secondary shadow-ds-lg backdrop-blur-sm transition-all duration-200 ease-ds hover:border-primary/35 hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
        className,
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
