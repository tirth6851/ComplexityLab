import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { BigOBadge } from "@/components/ui/big-o-badge";
import { ComplexityBadge } from "@/components/ui/complexity-badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>hello</Badge>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders complexity gradient variants", () => {
    render(<Badge complexity={5}>O(2ⁿ)</Badge>);
    const el = screen.getByText("O(2ⁿ)");
    expect(el.className).toContain("text-complexity-5");
  });
});

describe("BigOBadge", () => {
  it("shows the notation in mono", () => {
    render(<BigOBadge notation="O(n log n)" />);
    expect(screen.getByText("O(n log n)")).toBeInTheDocument();
  });

  it("appends the tier word when showTier is set", () => {
    render(<BigOBadge notation="O(2^n)" showTier />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("respects an explicit tier override", () => {
    render(<BigOBadge notation="O(custom)" tier="poor" showTier />);
    expect(screen.getByText("Bottleneck")).toBeInTheDocument();
  });
});

describe("ComplexityBadge", () => {
  it("renders known classes with a status dot", () => {
    const { container } = render(<ComplexityBadge complexity="O(n)" />);
    expect(screen.getByText("O(n)")).toBeInTheDocument();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(1);
  });

  it("falls back gracefully for unknown classes", () => {
    render(<ComplexityBadge complexity="O(α(n))" />);
    expect(screen.getByText("O(α(n))")).toBeInTheDocument();
  });
});
