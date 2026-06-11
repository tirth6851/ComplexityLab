import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IntroStrip } from "@/components/analyzer/intro-strip";

const STORAGE_KEY = "cl-analyzer-intro";

describe("IntroStrip", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the three getting-started steps on first visit", () => {
    render(<IntroStrip />);
    expect(
      screen.getByRole("region", { name: "Getting started" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Load a sample")).toBeInTheDocument();
    expect(screen.getByText("Analyze")).toBeInTheDocument();
    expect(screen.getByText("Save it")).toBeInTheDocument();
  });

  it("dismisses and persists the choice", async () => {
    const user = userEvent.setup();
    render(<IntroStrip />);

    await user.click(
      screen.getByRole("button", { name: /dismiss getting started/i }),
    );

    expect(
      screen.queryByRole("region", { name: "Getting started" }),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("v1");
  });

  it("stays hidden for returning users who dismissed it", () => {
    window.localStorage.setItem(STORAGE_KEY, "v1");
    render(<IntroStrip />);
    expect(
      screen.queryByRole("region", { name: "Getting started" }),
    ).not.toBeInTheDocument();
  });
});
