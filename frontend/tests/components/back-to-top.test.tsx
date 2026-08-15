import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackToTop } from "@/components/ui/back-to-top";

/**
 * jsdom implements neither matchMedia nor requestAnimationFrame, so both are
 * stubbed here rather than relying on a global polyfill — this component is
 * the only thing in the suite that needs them.
 */
function stubMatchMedia(reduceMotion: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && reduceMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function flushRaf() {
  vi.stubGlobal(
    "requestAnimationFrame",
    (cb: FrameRequestCallback): number => {
      cb(0);
      return 0;
    },
  );
}

/**
 * `fireEvent` (rather than a raw `window.dispatchEvent`) is what wraps the
 * listener's resulting `setState` in `act()`, so the assertion below sees the
 * flushed DOM instead of racing a pending render.
 */
function scrollTo(y: number) {
  window.scrollY = y;
  fireEvent(window, new Event("scroll"));
}

describe("BackToTop", () => {
  beforeEach(() => {
    flushRaf();
    stubMatchMedia(false);
    window.scrollY = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Note: `aria-hidden="true"` makes dom-accessibility-api compute an empty
  // accessible name for the node itself, so queries against a hidden button
  // use `getByRole(..., { hidden: true })` *without* a `name` filter — the
  // `aria-label` is asserted directly via `toHaveAttribute` instead. Only
  // once the button is visible does `name: "Back to top"` resolve.

  it("renders a real button with an accessible label", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { hidden: true });

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toHaveAttribute("aria-label", "Back to top");
  });

  it("is hidden and removed from the tab order before the scroll threshold", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { hidden: true });

    expect(button).toHaveAttribute("aria-hidden", "true");
    expect(button).toHaveAttribute("tabindex", "-1");
    expect(button.className).toContain("pointer-events-none");
    expect(button.className).toContain("opacity-0");
  });

  it("becomes visible and focusable after scrolling past the threshold", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { hidden: true });

    scrollTo(500);

    expect(button).toHaveAttribute("aria-hidden", "false");
    expect(button).toHaveAttribute("tabindex", "0");
    expect(button.className).toContain("opacity-100");
    expect(button.className).not.toContain("pointer-events-none");
    // Now discoverable by its accessible name too, like a normal control.
    expect(
      screen.getByRole("button", { name: "Back to top" }),
    ).toBe(button);
  });

  it("hides again once the reader scrolls back above the threshold", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { hidden: true });

    scrollTo(500);
    expect(button).toHaveAttribute("aria-hidden", "false");

    scrollTo(0);
    expect(button).toHaveAttribute("aria-hidden", "true");
    expect(button).toHaveAttribute("tabindex", "-1");
  });

  it("syncs to the current scroll position on mount (e.g. a mid-page reload)", () => {
    window.scrollY = 800;
    render(<BackToTop />);
    const button = screen.getByRole("button", { name: "Back to top" });

    expect(button).toHaveAttribute("aria-hidden", "false");
  });

  it("registers the scroll listener as passive", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    render(<BackToTop />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true },
    );
  });

  it("removes the scroll listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<BackToTop />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });

  it("smooth-scrolls to top on click", async () => {
    const user = userEvent.setup();
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    render(<BackToTop />);

    scrollTo(500);
    await user.click(screen.getByRole("button", { name: "Back to top" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("falls back to an instant jump when prefers-reduced-motion is set", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    const scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    render(<BackToTop />);

    scrollTo(500);
    await user.click(screen.getByRole("button", { name: "Back to top" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("accepts a className override for placement/testing hooks", () => {
    render(<BackToTop className="custom-class" />);
    expect(
      screen.getByRole("button", { hidden: true }).className,
    ).toContain("custom-class");
  });
});
