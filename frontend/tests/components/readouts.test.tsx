import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentAnalyses } from "@/components/readouts/recent-analyses";
import { SavedSnippets } from "@/components/readouts/saved-snippets";
import { ProgressOverview } from "@/components/readouts/progress-overview";
import type { Analysis, Snippet } from "@/types";

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

const analyses: Analysis[] = [
  {
    id: "a1",
    title: "quickSort()",
    language: "typescript",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    verdict: "",
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

const snippets: Snippet[] = [
  {
    id: "s1",
    title: "Memoized fib",
    language: "javascript",
    code: "function fib() {}",
    tags: ["dp"],
    savedAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

describe("RecentAnalyses", () => {
  it("renders analysis rows with complexity badges and relative time", () => {
    render(<RecentAnalyses analyses={analyses} />);
    expect(screen.getByText("quickSort()")).toBeInTheDocument();
    expect(screen.getByText("O(n log n)")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
    expect(screen.getByText("View all")).toHaveAttribute("href", "/analyses");
  });

  it("renders the empty state with an analyzer CTA", () => {
    render(<RecentAnalyses analyses={[]} />);
    expect(screen.getByText("No analyses yet")).toBeInTheDocument();
    expect(screen.getByText("Open analyzer")).toHaveAttribute(
      "href",
      "/analyzer",
    );
  });
});

describe("SavedSnippets", () => {
  it("renders snippet rows with tags", () => {
    render(<SavedSnippets snippets={snippets} />);
    expect(screen.getByText("Memoized fib")).toBeInTheDocument();
    expect(screen.getByText("dp")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<SavedSnippets snippets={[]} />);
    expect(screen.getByText("No saved snippets")).toBeInTheDocument();
  });
});

describe("ProgressOverview", () => {
  it("renders stats and language mix", () => {
    render(
      <ProgressOverview
        stats={[{ label: "Analyses", value: "4", hint: "+2 this week" }]}
        metrics={[{ label: "TypeScript", value: 75 }]}
      />,
    );
    expect(screen.getByText("Analyses")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Language mix")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    // Language-mix bars expose accessible progressbar semantics.
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-label", "TypeScript");
  });

  it("renders the empty state when there is no data", () => {
    render(<ProgressOverview stats={[]} metrics={[]} />);
    expect(screen.getByText("No progress yet")).toBeInTheDocument();
  });
});
