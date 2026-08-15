import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqItem } from "@/components/content/faq-item";

describe("FaqItem", () => {
  it("renders closed by default and opens the native <details> on click", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FaqItem question="What is Big-O?">
        <p>It describes growth rate.</p>
      </FaqItem>,
    );

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("It describes growth rate.")).toBeInTheDocument();

    await user.click(screen.getByText("What is Big-O?"));

    expect(details).toHaveAttribute("open");
  });

  it("respects defaultOpen", () => {
    const { container } = render(
      <FaqItem question="Open by default" defaultOpen>
        <p>Visible immediately.</p>
      </FaqItem>,
    );

    expect(container.querySelector("details")).toHaveAttribute("open");
  });

  it("renders the question inside a <summary> with the shared content heading style", () => {
    render(
      <FaqItem question="Styled like other headings">
        <p>Body</p>
      </FaqItem>,
    );

    const summary = screen.getByText("Styled like other headings").closest("summary");
    expect(summary).not.toBeNull();
    expect(summary).toHaveClass("font-display", "text-2xl", "font-semibold");
  });
});
