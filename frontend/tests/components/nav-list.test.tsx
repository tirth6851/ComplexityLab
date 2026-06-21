import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const usePathname = vi.fn(() => "/dashboard");

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

import { NavList } from "@/components/layout/nav-list";

describe("NavList", () => {
  it("renders every primary destination", () => {
    render(<NavList />);
    for (const label of [
      "Dashboard",
      "Analyzer",
      "Analyses",
      "Snippets",
      "Settings",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the current route with aria-current", () => {
    usePathname.mockReturnValue("/analyzer");
    render(<NavList />);
    expect(screen.getByText("Analyzer").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Dashboard").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("treats settings sub-pages as the Settings section", () => {
    usePathname.mockReturnValue("/settings/account");
    render(<NavList />);
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders Playground and Progress as active nav links", () => {
    usePathname.mockReturnValue("/dashboard");
    render(<NavList />);
    expect(screen.getByText("Playground").closest("a")).toHaveAttribute("href", "/playground");
    expect(screen.getByText("Progress").closest("a")).toHaveAttribute("href", "/progress");
    expect(screen.queryAllByText("Soon")).toHaveLength(0);
  });
});
