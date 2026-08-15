/**
 * Unit tests for SiteSearch / SiteSearchTrigger.
 *
 * Covers: hidden by default, Cmd/Ctrl+K opens it, live filtering, empty/no-
 * results states, result links, keyboard nav (arrows + Enter), Escape close
 * (via the Dialog primitive), and the decoupled trigger button.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
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

import { SiteSearch, SiteSearchTrigger } from "@/components/marketing/site-search";

// ── Visibility ─────────────────────────────────────────────────────────────────

describe("SiteSearch — default state", () => {
  it("renders no visible dialog until opened", () => {
    render(<SiteSearch />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ── Keyboard shortcut ──────────────────────────────────────────────────────────

describe("SiteSearch — Cmd/Ctrl+K shortcut", () => {
  it("Cmd+K (metaKey) opens the dialog", () => {
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Ctrl+K opens the dialog", () => {
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true, bubbles: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("plain 'k' without a modifier does not open the dialog", () => {
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", bubbles: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("the dialog is a proper accessible modal", () => {
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("Escape closes the dialog", () => {
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ── Empty / no-results states ────────────────────────────────────────────────

describe("SiteSearch — query states", () => {
  it("shows a hint when the query is empty", () => {
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    expect(screen.getByText("Type to search pages.")).toBeInTheDocument();
  });

  it("shows a no-results message for a query that matches nothing", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    await user.type(screen.getByRole("combobox"), "zzzznotarealtopic");
    expect(screen.getByText(/No pages match/)).toBeInTheDocument();
  });
});

// ── Live filtering + results ──────────────────────────────────────────────────

describe("SiteSearch — live filtering", () => {
  it("filters results as the user types", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    await user.type(screen.getByRole("combobox"), "quicksort");

    const results = screen.getAllByRole("option");
    expect(results).toHaveLength(1);
    expect(results[0]).toHaveTextContent("Quicksort");
  });

  it("each result links to the correct href", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    await user.type(screen.getByRole("combobox"), "binary search");

    const link = screen.getByRole("option", { name: /Binary Search/ });
    expect(link).toHaveAttribute("href", "/algorithms/binary-search");
  });

  it("clicking a result closes the dialog", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    await user.type(screen.getByRole("combobox"), "quicksort");

    await user.click(screen.getByRole("option", { name: /Quicksort/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets the query each time the dialog is reopened", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    await user.type(screen.getByRole("combobox"), "quicksort");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByText("Type to search pages.")).toBeInTheDocument();
  });
});

// ── Keyboard navigation ────────────────────────────────────────────────────────

describe("SiteSearch — arrow keys + Enter", () => {
  it("ArrowDown/ArrowUp move the active result and Enter navigates to it", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });

    const input = screen.getByRole("combobox");
    await user.type(input, "complexity");

    const results = screen.getAllByRole("option");
    expect(results.length).toBeGreaterThan(1);

    await user.keyboard("{ArrowDown}");
    expect(results[1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowUp}");
    expect(results[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(results[0].getAttribute("href")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("first result is active by default", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);
    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });
    await user.type(screen.getByRole("combobox"), "quicksort");

    expect(screen.getByRole("option", { name: /Quicksort/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

// ── Trigger button ─────────────────────────────────────────────────────────────

describe("SiteSearchTrigger", () => {
  it("renders a visible 'Search' button with a ⌘K hint", () => {
    render(<SiteSearch />);
    render(<SiteSearchTrigger />);
    expect(screen.getByRole("button", { name: /Search/ })).toBeInTheDocument();
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("clicking the trigger opens a separately-mounted SiteSearch", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SiteSearch />
        <SiteSearchTrigger />
      </>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Search/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
