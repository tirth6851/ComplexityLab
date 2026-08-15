import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FaqPage from "@/app/faq/page";

describe("FaqPage", () => {
  it("renders every question as a collapsible item, with the first one open", () => {
    const { container } = render(<FaqPage />);

    const detailsList = container.querySelectorAll("details");
    expect(detailsList.length).toBe(8);
    expect(detailsList[0]).toHaveAttribute("open");
    for (const details of Array.from(detailsList).slice(1)) {
      expect(details).not.toHaveAttribute("open");
    }

    expect(
      screen.getByText("What does Big-O notation actually mean?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Do I need to memorize Big-O classes for interviews?"),
    ).toBeInTheDocument();
  });

  it("keeps the closing CTA section as a plain, non-collapsible section", () => {
    render(<FaqPage />);

    const heading = screen.getByRole("heading", { name: "Still have questions?" });
    expect(heading.closest("details")).toBeNull();
  });

  it("emits FAQPage structured data mirroring the on-page questions", () => {
    const { container } = render(<FaqPage />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const data = JSON.parse(script!.innerHTML) as {
      "@type": string;
      mainEntity: { "@type": string; name: string; acceptedAnswer: { text: string } }[];
    };
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(8);
    expect(data.mainEntity[0].name).toBe("What does Big-O notation actually mean?");
    expect(data.mainEntity[0].acceptedAnswer.text.length).toBeGreaterThan(0);
  });
});
