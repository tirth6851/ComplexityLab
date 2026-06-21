/**
 * Unit tests for the Dialog primitive.
 *
 * Covers: render when open/closed, role/aria attrs, Escape key, Tab trap,
 * Shift+Tab trap, backdrop click, X-button click, initialFocusRef, focus return.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@/components/ui/dialog";

// ── Render ─────────────────────────────────────────────────────────────────────

describe("Dialog — render", () => {
  it("renders content and title when open", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test Dialog">
        <p>Dialog body</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Closed">
        <p>Hidden</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("has aria-modal=true and aria-labelledby pointing at the title", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="A11y check">
        <p>Content</p>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)).toHaveTextContent("A11y check");
  });
});

// ── Keyboard ───────────────────────────────────────────────────────────────────

describe("Dialog — keyboard", () => {
  it("Escape calls onClose", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog open={true} onClose={onClose} title="Esc test">
        <button>Focusable</button>
      </Dialog>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Tab wraps from last focusable element to first", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open={true} onClose={vi.fn()} title="Trap test">
        <button>Alpha</button>
        <button>Beta</button>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    // DOM order: [X close btn, Alpha, Beta]
    const buttons = within(dialog).getAllByRole("button");
    buttons[buttons.length - 1].focus();
    await user.tab();
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("Shift+Tab wraps from first focusable element to last", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open={true} onClose={vi.fn()} title="Trap Shift test">
        <button>Only</button>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    // DOM order: [X close btn, Only]
    const buttons = within(dialog).getAllByRole("button");
    buttons[0].focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });
});

// ── Interactions ───────────────────────────────────────────────────────────────

describe("Dialog — interactions", () => {
  it("backdrop click calls onClose", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Backdrop">
        <button>Content</button>
      </Dialog>,
    );
    const backdrop = document.querySelector("[aria-hidden='true']") as HTMLElement;
    backdrop.click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("X button calls onClose", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog open={true} onClose={onClose} title="Close btn">
        <p>Body</p>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ── Focus management ───────────────────────────────────────────────────────────

describe("Dialog — focus management", () => {
  it("focuses the initialFocusRef element on open", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <Dialog open={true} onClose={vi.fn()} title="Focus ref" initialFocusRef={ref}>
        <input ref={ref} defaultValue="hello" />
      </Dialog>,
    );
    expect(document.activeElement).toBe(ref.current);
  });

  it("returns focus to the element that triggered the dialog on close", async () => {
    const user = userEvent.setup();

    function Wrapper() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open dialog</button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Return focus">
            <button>Inside</button>
          </Dialog>
        </>
      );
    }

    render(<Wrapper />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
  });
});
