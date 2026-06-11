import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SnippetItem } from "@/components/snippets/snippet-item";
import type { Snippet } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const snippet: Snippet = {
  id: "s-1",
  title: "Memoized fib",
  language: "javascript",
  code: "function fib(n) { /* … */ }",
  tags: ["dp"],
  savedAt: "2026-06-09T10:00:00Z",
};

describe("SnippetItem", () => {
  it("hides code until the row is expanded", async () => {
    const user = userEvent.setup();
    render(
      <SnippetItem
        snippet={snippet}
        deleteAction={async () => ({ ok: true })}
      />,
    );

    expect(
      screen.queryByText("function fib(n) { /* … */ }"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /show code for memoized fib/i }),
    );

    expect(screen.getByText("function fib(n) { /* … */ }")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open in analyzer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy snippet/i }),
    ).toBeInTheDocument();
  });

  it("collapses again on a second click", async () => {
    const user = userEvent.setup();
    render(
      <SnippetItem
        snippet={snippet}
        deleteAction={async () => ({ ok: true })}
      />,
    );

    const toggle = screen.getByRole("button", {
      name: /show code for memoized fib/i,
    });
    await user.click(toggle);
    await user.click(
      screen.getByRole("button", { name: /hide code for memoized fib/i }),
    );
    expect(
      screen.queryByText("function fib(n) { /* … */ }"),
    ).not.toBeInTheDocument();
  });
});
