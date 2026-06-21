import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMarkdown } from "@/components/chat/chat-markdown";

describe("ChatMarkdown — plain text", () => {
  it("renders a simple sentence as a paragraph", () => {
    render(<ChatMarkdown content="Big-O is O(n)." />);
    expect(screen.getByText("Big-O is O(n).")).toBeInTheDocument();
  });

  it("renders multiple paragraphs separated by blank lines", () => {
    render(<ChatMarkdown content={"First paragraph.\n\nSecond paragraph."} />);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });
});

describe("ChatMarkdown — inline formatting", () => {
  it("renders **bold** text as <strong>", () => {
    render(<ChatMarkdown content="This is **bold** text." />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  it("renders *italic* text as <em>", () => {
    render(<ChatMarkdown content="This is *italic* text." />);
    expect(screen.getByText("italic").tagName).toBe("EM");
  });

  it("renders `inline code` as <code>", () => {
    render(<ChatMarkdown content="Use `O(log n)` for binary search." />);
    const codeEl = screen.getByText("O(log n)");
    expect(codeEl.tagName).toBe("CODE");
  });
});

describe("ChatMarkdown — code blocks", () => {
  it("renders a fenced code block as <pre><code>", () => {
    const content = "```python\ndef hello():\n    print('Hi')\n```";
    render(<ChatMarkdown content={content} />);
    expect(screen.getByText(/def hello/)).toBeInTheDocument();
    const pre = document.querySelector("pre");
    expect(pre).toBeInTheDocument();
  });

  it("shows a language label above the code block when a lang is specified", () => {
    render(<ChatMarkdown content={"```python\nprint('hi')\n```"} />);
    expect(screen.getByText("python")).toBeInTheDocument();
  });

  it("renders a code block without a language tag without error", () => {
    render(<ChatMarkdown content={"```\nx = 1\n```"} />);
    expect(screen.getByText("x = 1")).toBeInTheDocument();
  });

  it("renders text before and after a code block", () => {
    const content = "See this:\n\n```python\npass\n```\n\nDone.";
    render(<ChatMarkdown content={content} />);
    expect(screen.getByText(/See this/)).toBeInTheDocument();
    expect(screen.getByText("pass")).toBeInTheDocument();
    expect(screen.getByText("Done.")).toBeInTheDocument();
  });
});

describe("ChatMarkdown — lists", () => {
  it("renders unordered list items", () => {
    const content = "Steps:\n- First item\n- Second item\n- Third item";
    render(<ChatMarkdown content={content} />);
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
    expect(document.querySelector("ul")).toBeInTheDocument();
  });

  it("renders ordered list items", () => {
    const content = "1. Step one\n2. Step two\n3. Step three";
    render(<ChatMarkdown content={content} />);
    expect(screen.getByText("Step one")).toBeInTheDocument();
    expect(document.querySelector("ol")).toBeInTheDocument();
  });
});

describe("ChatMarkdown — headings", () => {
  it("renders # as h3", () => {
    render(<ChatMarkdown content="# Big heading" />);
    expect(screen.getByRole("heading", { name: "Big heading", level: 3 })).toBeInTheDocument();
  });

  it("renders ## as h4", () => {
    render(<ChatMarkdown content="## Medium heading" />);
    expect(screen.getByRole("heading", { name: "Medium heading", level: 4 })).toBeInTheDocument();
  });

  it("renders ### as h5", () => {
    render(<ChatMarkdown content="### Small heading" />);
    const h5 = document.querySelector("h5");
    expect(h5).toHaveTextContent("Small heading");
  });
});
