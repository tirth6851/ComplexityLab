import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const usePathname = vi.fn(() => "/");

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

import { ConsentGate } from "@/components/legal/consent-gate";

function clearConsentCookie() {
  document.cookie = "cl-consent=; path=/; max-age=0";
}

describe("ConsentGate", () => {
  beforeEach(() => {
    clearConsentCookie();
    usePathname.mockReturnValue("/");
  });

  it("blocks with a dialog when no consent cookie is present", async () => {
    render(<ConsentGate />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Before you enter the lab")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("accept stores the consent cookie and dismisses the dialog", async () => {
    const user = userEvent.setup();
    render(<ConsentGate />);
    await user.click(
      await screen.findByRole("button", { name: "Accept and continue" }),
    );
    expect(document.cookie).toContain("cl-consent=v1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not reappear once consent is stored", () => {
    document.cookie = "cl-consent=v1; path=/";
    render(<ConsentGate />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("decline navigates away to google.com", async () => {
    const replace = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { ...original, replace },
      writable: true,
    });

    const user = userEvent.setup();
    render(<ConsentGate />);
    await user.click(await screen.findByRole("button", { name: "Decline" }));
    expect(replace).toHaveBeenCalledWith("https://www.google.com");

    Object.defineProperty(window, "location", {
      value: original,
      writable: true,
    });
  });

  it("stays out of the way on the legal pages themselves", async () => {
    usePathname.mockReturnValue("/privacy");
    render(<ConsentGate />);
    // effect runs, but the exempt path suppresses the dialog
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
