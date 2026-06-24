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
  it("renders every workspace destination", () => {
    render(<NavList />);
    for (const label of [
      "Dashboard",
      "Analyzer",
      "Analyses",
      "Snippets",
      "Chat",
      "Playground",
      "Progress",
      "Learning Hub",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
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

  it("does not render Settings in the workspace nav", () => {
    usePathname.mockReturnValue("/settings/account");
    render(<NavList />);
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("renders Playground and Progress as active nav links", () => {
    usePathname.mockReturnValue("/dashboard");
    render(<NavList />);
    expect(screen.getByText("Playground").closest("a")).toHaveAttribute("href", "/playground");
    expect(screen.getByText("Progress").closest("a")).toHaveAttribute("href", "/progress");
    expect(screen.queryAllByText("Soon")).toHaveLength(0);
  });
});
