import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast, useToastSafe } from "@/components/ui/toaster";

function Trigger({ variant }: { variant?: "success" | "error" }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast("Saved to your library", { variant })}>
      fire
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows a toast when fired and dismisses it on demand", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "fire" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Saved to your library",
    );

    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("marks error toasts with the alert styling", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger variant="error" />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "fire" }));
    expect(screen.getByRole("status").className).toContain("destructive");
  });

  it("useToastSafe degrades to a no-op without a provider", async () => {
    function Orphan() {
      const { toast } = useToastSafe();
      return <button onClick={() => toast("nope")}>orphan</button>;
    }
    const user = userEvent.setup();
    render(<Orphan />);
    // Must not throw, must not render a toast.
    await user.click(screen.getByRole("button", { name: "orphan" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
