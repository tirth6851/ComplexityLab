import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "@/components/ui/copy-button";

describe("CopyButton", () => {
  it("copies the value and flashes a confirmation", async () => {
    // userEvent installs a clipboard stub in jsdom.
    const user = userEvent.setup();
    render(<CopyButton value="const x = 1;" label="Copy source code" />);

    await user.click(screen.getByRole("button", { name: "Copy source code" }));

    expect(await window.navigator.clipboard.readText()).toBe("const x = 1;");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});
