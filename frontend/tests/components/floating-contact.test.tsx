/**
 * Unit tests for the marketing-only floating contact bubble.
 *
 * Covers: hidden on authenticated app routes, visible on public routes,
 * open/close interactions (trigger, close button, Escape, outside click),
 * mailto link + /about link content, and focus management (focus enters the
 * panel on open, returns to the trigger on close).
 */

import { describe, expect, it, vi } from "vitest";
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

import { FloatingContact } from "@/components/marketing/floating-contact";

describe("FloatingContact — visibility by route", () => {
  it("renders the trigger on public/marketing routes", () => {
    usePathname.mockReturnValue("/");
    render(<FloatingContact />);
    expect(
      screen.getByRole("button", { name: "Contact us" }),
    ).toBeInTheDocument();
  });

  it.each([
    "/dashboard",
    "/dashboard/settings",
    "/analyzer",
    "/analyses/123",
    "/snippets",
    "/playground",
    "/progress",
    "/settings/account",
    "/chat",
    "/learning",
    "/learning/lesson-1",
  ])("renders nothing on authenticated app route %s", (path) => {
    usePathname.mockReturnValue(path);
    const { container } = render(<FloatingContact />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not treat a marketing route with a similar name as an app route", () => {
    // Guards against overly broad prefix matching (e.g. "/settingsomething").
    usePathname.mockReturnValue("/settingsomething");
    render(<FloatingContact />);
    expect(
      screen.getByRole("button", { name: "Contact us" }),
    ).toBeInTheDocument();
  });
});

describe("FloatingContact — panel contents", () => {
  it("opens the panel with heading, mailto link, and about link", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    await user.click(screen.getByRole("button", { name: "Contact us" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Questions or feedback?")).toBeInTheDocument();

    const mailLink = screen.getByRole("link", {
      name: /tirth2093@gmail\.com/,
    });
    expect(mailLink).toHaveAttribute("href", "mailto:tirth2093@gmail.com");

    const aboutLink = screen.getByRole("link", { name: "More about us" });
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("is closed by default", () => {
    usePathname.mockReturnValue("/");
    render(<FloatingContact />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("FloatingContact — interactions", () => {
  it("toggles closed when the trigger is clicked again", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    const trigger = screen.getByRole("button", { name: "Contact us" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes via the close button", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    await user.click(screen.getByRole("button", { name: "Contact us" }));
    await user.click(
      screen.getByRole("button", { name: "Close contact panel" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    await user.click(screen.getByRole("button", { name: "Contact us" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on an outside click", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(
      <div>
        <button>Outside</button>
        <FloatingContact />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Contact us" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the /about link is clicked", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    await user.click(screen.getByRole("button", { name: "Contact us" }));
    await user.click(screen.getByRole("link", { name: "More about us" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sets aria-expanded on the trigger to reflect panel state", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    const trigger = screen.getByRole("button", { name: "Contact us" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("FloatingContact — focus management", () => {
  it("moves focus into the panel when it opens", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    await user.click(screen.getByRole("button", { name: "Contact us" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("returns focus to the trigger when the panel closes via Escape", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    const trigger = screen.getByRole("button", { name: "Contact us" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(document.activeElement).toBe(trigger);
  });

  it("traps Tab within the panel", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<FloatingContact />);

    await user.click(screen.getByRole("button", { name: "Contact us" }));
    const dialog = screen.getByRole("dialog");
    const focusable = dialog.querySelectorAll("a[href], button");
    const last = focusable[focusable.length - 1] as HTMLElement;

    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(focusable[0]);
  });
});
