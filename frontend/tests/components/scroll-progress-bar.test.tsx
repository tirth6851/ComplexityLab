/**
 * Unit tests for ScrollProgressBar.
 *
 * Covers: width = scrollY / (scrollHeight - clientHeight), rAF-throttled
 * scroll/resize handling, the divide-by-zero guard on short pages, cleanup
 * on unmount, and that the indicator stays fully decorative (aria-hidden,
 * no tab stop).
 */

import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";

interface ScrollMetrics {
  scrollHeight: number;
  clientHeight: number;
  scrollY: number;
}

function setScrollMetrics({ scrollHeight, clientHeight, scrollY }: ScrollMetrics) {
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: clientHeight,
    configurable: true,
  });
  Object.defineProperty(window, "scrollY", {
    value: scrollY,
    configurable: true,
    writable: true,
  });
}

/**
 * jsdom's real requestAnimationFrame is timer-based and async, which would
 * make the throttling assertions racy. Stub it so each test drives frames
 * by hand: `flush()` runs the single pending callback, exactly like one
 * animation frame firing.
 */
function mockRaf() {
  let pending: FrameRequestCallback | null = null;
  const requestAnimationFrameSpy = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb: FrameRequestCallback) => {
      pending = cb;
      return 1;
    });
  const cancelAnimationFrameSpy = vi
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation(() => {});

  return {
    requestAnimationFrameSpy,
    cancelAnimationFrameSpy,
    flush() {
      const cb = pending;
      pending = null;
      if (cb) act(() => cb(0));
    },
  };
}

function getTrack(container: HTMLElement) {
  return container.querySelector('[aria-hidden="true"]') as HTMLElement;
}

function getFill(container: HTMLElement) {
  return getTrack(container).firstElementChild as HTMLElement;
}

beforeEach(() => {
  setScrollMetrics({ scrollHeight: 0, clientHeight: 0, scrollY: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ScrollProgressBar — rendering", () => {
  it("renders a purely decorative, aria-hidden bar outside the tab order", () => {
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    const track = getTrack(container);
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute("aria-hidden", "true");
    // Decorative only: nothing inside should be focusable or exposed to AT.
    expect(track.querySelectorAll('button, a, [tabindex], [role]')).toHaveLength(0);
  });

  it("carries the codebase's standard width-transition utility so the global reduced-motion rule (globals.css) collapses it automatically", () => {
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    // Same pattern as ProgressBar / MetricGauge — no bespoke matchMedia
    // logic needed because @media (prefers-reduced-motion: reduce) in
    // globals.css already zeroes every transition-duration site-wide.
    expect(getFill(container).className).toContain("transition-[width]");
  });

  it("uses the primary (Signal Green) design token, never a hardcoded color", () => {
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    const fill = getFill(container);
    expect(fill.className).toContain("bg-primary");
    expect(fill.style.background).toBe("");
    expect(fill.getAttribute("style") ?? "").not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});

describe("ScrollProgressBar — progress calculation", () => {
  it("computes width as scrollY / (scrollHeight - clientHeight) on mount", () => {
    setScrollMetrics({ scrollHeight: 3000, clientHeight: 1000, scrollY: 500 });
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    // (3000 - 1000) = 2000 max scroll; 500 / 2000 = 25%.
    expect(getFill(container).style.width).toBe("25%");
  });

  it("re-measures on scroll, coalescing a burst of events into a single animation frame", () => {
    setScrollMetrics({ scrollHeight: 3000, clientHeight: 1000, scrollY: 0 });
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();
    expect(getFill(container).style.width).toBe("0%");

    raf.requestAnimationFrameSpy.mockClear();
    setScrollMetrics({ scrollHeight: 3000, clientHeight: 1000, scrollY: 1000 });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
    });

    // Three scroll events in the same frame schedule exactly one rAF call.
    expect(raf.requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    raf.flush();
    expect(getFill(container).style.width).toBe("50%");
  });

  it("re-measures on resize (e.g. viewport height change)", () => {
    setScrollMetrics({ scrollHeight: 2000, clientHeight: 1000, scrollY: 500 });
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();
    expect(getFill(container).style.width).toBe("50%");

    // Rotate to a shorter viewport: same scrollY, smaller denominator.
    setScrollMetrics({ scrollHeight: 2000, clientHeight: 500, scrollY: 500 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    raf.flush();

    // 500 / (2000 - 500) = 33.33...%
    expect(getFill(container).style.width).toBe(`${(500 / 1500) * 100}%`);
  });

  it("clamps to 100% width when scrollY overshoots the max scroll (e.g. elastic overscroll)", () => {
    setScrollMetrics({ scrollHeight: 2000, clientHeight: 1000, scrollY: 5000 });
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    expect(getFill(container).style.width).toBe("100%");
  });

  it("never reports a negative width when scrollY is negative", () => {
    setScrollMetrics({ scrollHeight: 2000, clientHeight: 1000, scrollY: -50 });
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    expect(getFill(container).style.width).toBe("0%");
  });
});

describe("ScrollProgressBar — divide-by-zero guard", () => {
  it("renders 0% width without throwing when the page is shorter than the viewport", () => {
    setScrollMetrics({ scrollHeight: 600, clientHeight: 800, scrollY: 0 });
    const raf = mockRaf();

    expect(() => {
      const { container } = render(<ScrollProgressBar />);
      raf.flush();
      expect(getFill(container).style.width).toBe("0%");
    }).not.toThrow();
  });

  it("renders 0% width when scrollHeight exactly equals clientHeight", () => {
    setScrollMetrics({ scrollHeight: 800, clientHeight: 800, scrollY: 0 });
    const raf = mockRaf();
    const { container } = render(<ScrollProgressBar />);
    raf.flush();

    expect(getFill(container).style.width).toBe("0%");
  });
});

describe("ScrollProgressBar — lifecycle", () => {
  it("attaches passive scroll/resize listeners on mount and removes them on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const raf = mockRaf();

    const { unmount } = render(<ScrollProgressBar />);
    raf.flush();

    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function), {
      passive: true,
    });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("cancels a pending animation frame on unmount instead of updating unmounted state", () => {
    const raf = mockRaf();
    const { unmount } = render(<ScrollProgressBar />);

    // Mount itself schedules one initial measurement; unmount before it
    // flushes must cancel it rather than let it fire after teardown.
    expect(raf.requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    unmount();

    expect(raf.cancelAnimationFrameSpy).toHaveBeenCalledTimes(1);
  });

  it("schedules a fresh measurement after React Strict Mode's dev-only mount → cleanup → remount effect cycle (regression: a cleanup that cancelled the pending frame without resetting the ref left the throttle guard permanently stuck, silently freezing the bar at 0% on every `next dev` session — reproduced and confirmed fixed against a real browser before writing this test)", () => {
    const raf = mockRaf();

    // Strict Mode double-invokes the effect synchronously, on the SAME
    // component instance (same `rafId` ref) — unlike two separate
    // render()/unmount() calls, which would each get a fresh ref and could
    // never reproduce this bug. The sequence is: effect #1 (schedules,
    // rafId = 1) → cleanup (cancels frame 1) → effect #2 (its
    // onScrollOrResize() call re-checks rafId). A cleanup that forgot to
    // reset rafId to null makes effect #2 see a stale non-null id and bail
    // out without scheduling — so only ONE requestAnimationFrame call
    // would happen instead of two.
    render(
      <StrictMode>
        <ScrollProgressBar />
      </StrictMode>,
    );

    expect(raf.requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
  });
});
