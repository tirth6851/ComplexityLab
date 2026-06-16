/**
 * Unit tests for ConfirmDeleteButton — the two-step destructive button
 * reused across analyses and snippets.
 *
 * Covers: idle state, arm-on-click, 3s auto-disarm, disarm-on-blur,
 * pending/disabled while action runs, toast-on-failure, no-toast-on-success.
 */

import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useToastSafe } from "@/components/ui/toaster";

vi.mock("@/components/ui/toaster", () => ({
  useToastSafe: vi.fn(),
}));

import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockToast = vi.fn();
const mockedUseToastSafe = useToastSafe as Mock;

function setup(action = vi.fn().mockResolvedValue({ ok: true }), label = "Delete analysis") {
  vi.clearAllMocks();
  mockedUseToastSafe.mockReturnValue({ toast: mockToast });
  const user = userEvent.setup();
  render(<ConfirmDeleteButton action={action} label={label} />);
  return { user, action };
}

// ── Idle state ────────────────────────────────────────────────────────────────

describe("ConfirmDeleteButton — idle state", () => {
  it("renders in the disarmed state with the correct aria-label and no pending text", () => {
    setup();
    const btn = screen.getByRole("button", { name: "Delete analysis" });
    expect(btn).not.toBeDisabled();
    expect(screen.queryByText("Sure?")).not.toBeInTheDocument();
    expect(screen.queryByText("…")).not.toBeInTheDocument();
  });
});

// ── Arm / disarm ──────────────────────────────────────────────────────────────

describe("ConfirmDeleteButton — arm and blur-disarm", () => {
  it("arms on first click — updates aria-label and shows Sure?", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Delete analysis" }));

    expect(screen.getByRole("button", { name: "Confirm: Delete analysis" })).toBeInTheDocument();
    expect(screen.getByText("Sure?")).toBeInTheDocument();
  });

  it("disarms on blur before the 3-second timer fires", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Delete analysis" }));
    expect(screen.getByText("Sure?")).toBeInTheDocument();

    // Tab away triggers onBlur which calls setArmed(false) immediately.
    await user.tab();

    await waitFor(() => {
      expect(screen.queryByText("Sure?")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Delete analysis" })).toBeInTheDocument();
  });
});

// ── Auto-disarm timer (isolated fake-timer block) ─────────────────────────────
// Keep this in its own describe so beforeEach/afterEach guarantee vi.useRealTimers()
// runs even if the test itself times out — preventing timer leaks into later tests.

describe("ConfirmDeleteButton — auto-disarm timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("auto-disarms after 3 seconds without a blur or second click", async () => {
    mockedUseToastSafe.mockReturnValue({ toast: mockToast });
    render(<ConfirmDeleteButton action={vi.fn()} label="Delete analysis" />);

    // Use fireEvent (synchronous) instead of user.click() to avoid user-event's
    // internal setTimeout dependencies, which hang with fake timers.
    fireEvent.click(screen.getByRole("button", { name: "Delete analysis" }));
    await act(async () => {}); // flush the setArmed(true) state update

    expect(screen.getByText("Sure?")).toBeInTheDocument();

    // Fire the 3-second disarm timeout.
    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(screen.queryByText("Sure?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete analysis" })).toBeInTheDocument();
  });
});

// ── Delete flow ───────────────────────────────────────────────────────────────

describe("ConfirmDeleteButton — delete flow", () => {
  it("calls action() on the second (confirmation) click", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const { user } = setup(action);

    await user.click(screen.getByRole("button", { name: "Delete analysis" }));
    await user.click(screen.getByRole("button", { name: "Confirm: Delete analysis" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });

  it("disables the button and shows … while the action is pending", async () => {
    let resolveAction!: (v: { ok: boolean }) => void;
    const action = vi.fn().mockReturnValue(
      new Promise<{ ok: boolean }>(r => { resolveAction = r; }),
    );
    const { user } = setup(action);

    await user.click(screen.getByRole("button", { name: "Delete analysis" }));
    // Fire the confirm click but don't await — the handler suspends at `await action()`.
    void user.click(screen.getByRole("button", { name: "Confirm: Delete analysis" }));

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
      expect(screen.getByText("…")).toBeInTheDocument();
    });

    // Resolve so the component can settle before cleanup.
    resolveAction({ ok: true });
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
  });

  it("shows no toast when the action succeeds", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const { user } = setup(action);

    await user.click(screen.getByRole("button", { name: "Delete analysis" }));
    await user.click(screen.getByRole("button", { name: "Confirm: Delete analysis" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("shows an error toast with the action's error string on failure", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: "Row not found." });
    const { user } = setup(action);

    await user.click(screen.getByRole("button", { name: "Delete analysis" }));
    await user.click(screen.getByRole("button", { name: "Confirm: Delete analysis" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Row not found.", { variant: "error" });
    });
  });

  it("shows the generic toast when error is undefined", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false });
    const { user } = setup(action);

    await user.click(screen.getByRole("button", { name: "Delete analysis" }));
    await user.click(screen.getByRole("button", { name: "Confirm: Delete analysis" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "Delete failed — try again.",
        { variant: "error" },
      );
    });
  });
});
