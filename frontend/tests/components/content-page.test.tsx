import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentPage } from "@/components/content/content-page";

describe("ContentPage", () => {
  it("renders no byline when lastUpdated is omitted", () => {
    render(
      <ContentPage eyebrow="Guide" title="Test Page" dek="A test dek.">
        <p>Body</p>
      </ContentPage>,
    );

    expect(screen.getByRole("heading", { name: "Test Page" })).toBeInTheDocument();
    expect(screen.queryByText(/Last updated/i)).not.toBeInTheDocument();
    expect(document.querySelector("time")).not.toBeInTheDocument();
  });

  it("renders a human-readable byline when lastUpdated is passed", () => {
    render(
      <ContentPage
        eyebrow="Guide"
        title="Test Page"
        dek="A test dek."
        lastUpdated="2026-07-25"
      >
        <p>Body</p>
      </ContentPage>,
    );

    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    const time = document.querySelector("time");
    expect(time).toHaveAttribute("dateTime", "2026-07-25");
    expect(time).toHaveTextContent("July 25, 2026");
  });
});
