import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const STORAGE_KEY = "cl-banner-dismissed-v1";

const usePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SiteBanner } from "@/components/marketing/site-banner";

describe("SiteBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    usePathname.mockReturnValue("/");
  });

  it("shows the announcement on a public page", () => {
    render(<SiteBanner />);
    expect(
      screen.getByRole("region", { name: "Site announcement" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explore/i }),
    ).toHaveAttribute("href", "/complexity-cheatsheet");
  });

  it("stays hidden for returning visitors who already dismissed it", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    render(<SiteBanner />);
    expect(
      screen.queryByRole("region", { name: "Site announcement" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    "/dashboard",
    "/dashboard/settings",
    "/analyzer",
    "/analyses/123",
    "/snippets",
    "/playground",
    "/progress",
    "/settings/account",
    "/chat",
    "/learning",
    "/learning/lessons/1",
  ])("never renders on the authenticated app route %s", (path) => {
    usePathname.mockReturnValue(path);
    render(<SiteBanner />);
    expect(
      screen.queryByRole("region", { name: "Site announcement" }),
    ).not.toBeInTheDocument();
  });

  it.each(["/", "/guides", "/complexity-cheatsheet", "/analyzers-list"])(
    "renders on public/marketing route %s",
    (path) => {
      usePathname.mockReturnValue(path);
      render(<SiteBanner />);
      expect(
        screen.getByRole("region", { name: "Site announcement" }),
      ).toBeInTheDocument();
    },
  );

  it("never single-line-truncates the announcement below the sm breakpoint (regression: a bare `truncate` class silently clipped the 'Explore →' CTA off-screen on real ~390px phone viewports — jsdom doesn't lay out CSS so this can't be caught by rendering alone; confirmed and fixed against a real mobile browser, this just guards the class doesn't come back)", () => {
    render(<SiteBanner />);
    const message = screen.getByText(/guides, algorithm walkthroughs/i);
    const classes = message.className.split(/\s+/);

    expect(classes).not.toContain("truncate");
    expect(classes).toContain("sm:truncate");
  });

  // Runs last: dismissal flips an in-memory flag for the module's lifetime
  // (private-mode fallback), so it must not precede assertions that expect
  // the banner to still be visible.
  it("dismisses and persists the choice in localStorage", async () => {
    const user = userEvent.setup();
    render(<SiteBanner />);

    await user.click(
      screen.getByRole("button", { name: "Dismiss announcement" }),
    );

    expect(
      screen.queryByRole("region", { name: "Site announcement" }),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
  });
});
