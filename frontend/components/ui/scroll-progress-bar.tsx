"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fraction of the document scrolled, clamped to [0, 1]. Guards the
 * divide-by-zero case where the page is shorter than the viewport (nothing
 * to scroll) so the bar reads as 0% instead of NaN/Infinity.
 */
function readScrollFraction(): number {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - doc.clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / maxScroll));
}

/**
 * ScrollProgressBar — a hairline indicator fixed to the top of the viewport
 * that fills left-to-right as the reader scrolls through the current page.
 *
 * Purely decorative: scroll position is always conveyed by the browser's
 * native scrollbar too, so this is `aria-hidden` and never receives focus —
 * it must not be announced to screen readers or sit in the tab order.
 *
 * z-40 sits above sticky page chrome (topbar is z-30) but below the mobile
 * nav drawer (z-[100]), Dialog (z-50), and toasts (z-[500]) so it never
 * competes with anything that opens on top of the page.
 */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      rafId.current = null;
      setProgress(readScrollFraction());
    };

    // rAF-throttle: collapse a burst of scroll/resize events into at most
    // one measurement per animation frame instead of one per pixel.
    const onScrollOrResize = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(measure);
    };

    onScrollOrResize(); // capture initial position (e.g. scroll restoration)

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      // Reset, not just cancel: a cancelled frame is no longer "pending", but
      // leaving the ref non-null would make the next mount's first
      // onScrollOrResize() call see a stale id and skip scheduling forever —
      // exactly what happened under React Strict Mode's dev-only
      // mount→cleanup→remount cycle before this fix (the bar would freeze at
      // 0% on every `next dev` session, verified with a real browser).
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]"
    >
      <div
        className="h-full bg-primary transition-[width] duration-[360ms] ease-ds"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
