import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { UtmCapture } from "@/components/marketing/utm-capture";
import { getStoredUtmParams } from "@/lib/utm";

const STORAGE_KEY = "cl-utm-v1";
const originalLocation = window.location;

function setSearch(search: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, search },
  });
}

describe("UtmCapture", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("renders nothing", () => {
    setSearch("");
    const { container } = render(<UtmCapture />);
    expect(container).toBeEmptyDOMElement();
  });

  it("captures utm params from window.location.search on mount", async () => {
    setSearch("?utm_source=newsletter&utm_medium=email&utm_campaign=launch");
    render(<UtmCapture />);

    await vi.waitFor(() => {
      expect(getStoredUtmParams()).toEqual({
        utm_source: "newsletter",
        utm_medium: "email",
        utm_campaign: "launch",
      });
    });
  });

  it("does not touch storage when there are no utm params in the URL", async () => {
    setSearch("?ref=abc");
    render(<UtmCapture />);

    // Give the effect a tick to run, then assert nothing was written.
    await Promise.resolve();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getStoredUtmParams()).toBeNull();
  });

  it("first-touch: a second mount with different params does not overwrite the first capture", async () => {
    setSearch("?utm_source=google");
    const first = render(<UtmCapture />);
    await vi.waitFor(() => {
      expect(getStoredUtmParams()).toEqual({ utm_source: "google" });
    });
    first.unmount();

    setSearch("?utm_source=facebook");
    render(<UtmCapture />);
    await Promise.resolve();
    expect(getStoredUtmParams()).toEqual({ utm_source: "google" });
  });
});
