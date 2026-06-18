/**
 * Unit tests for SaveDialog.
 *
 * Dialog is mocked as a simple passthrough to keep these tests focused on form
 * behaviour: title validation, tags parsing, error display, pending state.
 */

import * as React from "react";
import { describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: vi.fn(
    ({
      open,
      children,
      title,
    }: {
      open: boolean;
      children: React.ReactNode;
      title: string;
      onClose: () => void;
    }) =>
      open ? (
        <div role="dialog">
          <h2>{title}</h2>
          {children}
        </div>
      ) : null,
  ),
}));

import { SaveDialog } from "@/components/analyzer/save-dialog";

// ── Helpers ────────────────────────────────────────────────────────────────────

function setup({
  onSave = vi.fn().mockResolvedValue({ ok: true }),
  onClose = vi.fn(),
  defaultTitle = "myFunc()",
  showTags = false,
}: {
  onSave?: Mock;
  onClose?: Mock;
  defaultTitle?: string;
  showTags?: boolean;
} = {}) {
  const user = userEvent.setup();
  render(
    <SaveDialog
      open={true}
      onClose={onClose}
      onSave={onSave}
      defaultTitle={defaultTitle}
      showTags={showTags}
    />,
  );
  return { user, onSave, onClose };
}

// ── Title validation ───────────────────────────────────────────────────────────

describe("SaveDialog — title validation", () => {
  it("Save button is disabled when title is empty", () => {
    setup({ defaultTitle: "" });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Save button is disabled when title is whitespace only", async () => {
    const { user } = setup({ defaultTitle: "" });
    await user.type(screen.getByLabelText("Title"), "   ");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Save button is enabled when title has non-whitespace content", () => {
    setup({ defaultTitle: "My Analysis" });
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("calls onSave with trimmed title on submit", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const { user } = setup({ onSave, defaultTitle: "  My Analysis  " });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith("My Analysis", undefined);
  });

  it("prefills the title input with defaultTitle", () => {
    setup({ defaultTitle: "prefilled()" });
    expect(screen.getByLabelText("Title")).toHaveValue("prefilled()");
  });
});

// ── Tags ───────────────────────────────────────────────────────────────────────

describe("SaveDialog — tags", () => {
  it("does not render Tags input when showTags=false", () => {
    setup({ showTags: false });
    expect(screen.queryByLabelText("Tags")).not.toBeInTheDocument();
  });

  it("renders Tags input when showTags=true", () => {
    setup({ showTags: true });
    expect(screen.getByLabelText("Tags")).toBeInTheDocument();
  });

  it("parses tags: splits on comma, trims, drops empties", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const { user } = setup({ onSave, showTags: true });
    await user.type(screen.getByLabelText("Tags"), "sorting, array, , extra");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith("myFunc()", ["sorting", "array", "extra"]);
  });

  it("passes undefined for tags when showTags=false", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const { user } = setup({ onSave, showTags: false });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith("myFunc()", undefined);
  });
});

// ── Error handling ─────────────────────────────────────────────────────────────

describe("SaveDialog — error handling", () => {
  it("shows action error in role=alert when onSave fails", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: false, error: "Rate limited." });
    const { user } = setup({ onSave });
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Rate limited.");
    });
  });

  it("shows generic error message when error is undefined", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: false });
    const { user } = setup({ onSave });
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Save failed");
    });
  });

  it("does not call onClose when onSave fails", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: false, error: "Error." });
    const { user, onClose } = setup({ onSave });
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when onSave succeeds", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const { user, onClose } = setup({ onSave });
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});

// ── Pending state ──────────────────────────────────────────────────────────────

describe("SaveDialog — pending state", () => {
  it("Save button is disabled and shows Saving… while pending", async () => {
    let resolve!: (v: { ok: boolean }) => void;
    const onSave = vi
      .fn()
      .mockReturnValue(new Promise<{ ok: boolean }>((r) => { resolve = r; }));
    const { user } = setup({ onSave });
    void user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    });
    resolve({ ok: true });
  });

  it("Cancel button is disabled while pending", async () => {
    let resolve!: (v: { ok: boolean }) => void;
    const onSave = vi
      .fn()
      .mockReturnValue(new Promise<{ ok: boolean }>((r) => { resolve = r; }));
    const { user } = setup({ onSave });
    void user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });
    resolve({ ok: true });
  });
});
