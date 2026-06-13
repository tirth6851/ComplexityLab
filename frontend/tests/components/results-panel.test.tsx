import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsPanel } from "@/components/analyzer/results-panel";
import { analyzeCode } from "@/lib/analysis/engine";
import { SAMPLES } from "@/lib/analysis/samples";

const analysis = analyzeCode({
  code: SAMPLES.typescript[0].code, // binary search → O(log n)
  language: "typescript",
});

describe("ResultsPanel", () => {
  it("renders the idle call-to-action", () => {
    render(<ResultsPanel status="idle" analysis={null} />);
    expect(screen.getByText("Ready to analyze")).toBeInTheDocument();
  });

  it("renders an injected idle action only in the idle state", () => {
    const { rerender } = render(
      <ResultsPanel
        status="idle"
        analysis={null}
        idleAction={<button>Run first analysis</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Run first analysis" }),
    ).toBeInTheDocument();

    rerender(
      <ResultsPanel
        status="analyzing"
        analysis={null}
        idleAction={<button>Run first analysis</button>}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Run first analysis" }),
    ).not.toBeInTheDocument();
  });

  it("renders the scanning state", () => {
    render(<ResultsPanel status="analyzing" analysis={null} />);
    expect(screen.getByText("Scanning structure…")).toBeInTheDocument();
  });

  it("renders the error state with the message", () => {
    render(
      <ResultsPanel status="error" analysis={null} error="Engine exploded" />,
    );
    expect(screen.getByText("Analysis failed")).toBeInTheDocument();
    expect(screen.getByText("Engine exploded")).toBeInTheDocument();
  });

  it("renders verdict readouts, gauges, timeline, and notes for a result", () => {
    render(<ResultsPanel status="done" analysis={analysis} />);

    // TIME / SPACE instrument rows
    expect(screen.getByText("TIME")).toBeInTheDocument();
    expect(screen.getByText("SPACE")).toBeInTheDocument();
    expect(screen.getAllByText("O(log n)").length).toBeGreaterThan(0);

    // metric gauges
    expect(screen.getByText("EST. OPS @ N=1000")).toBeInTheDocument();
    expect(screen.getByText("ENGINE CONFIDENCE")).toBeInTheDocument();

    // growth timeline (svg with accessible label)
    expect(
      screen.getByRole("img", { name: /growth curves/i }),
    ).toBeInTheDocument();

    // reasoning notes
    expect(screen.getByText("What the engine saw")).toBeInTheDocument();
  });

  it("renders injected result actions", () => {
    render(
      <ResultsPanel
        status="done"
        analysis={analysis}
        actions={<button>Save analysis</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Save analysis" }),
    ).toBeInTheDocument();
  });
});

describe("ResultsPanel screen-reader announcements", () => {
  it("announces the verdict politely when analysis completes", () => {
    render(<ResultsPanel status="done" analysis={analysis} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Analysis complete.");
    expect(status).toHaveTextContent(analysis.time.notation);
    expect(status).toHaveTextContent(analysis.space.notation);
  });

  it("announces progress while analyzing", () => {
    render(<ResultsPanel status="analyzing" analysis={null} />);
    expect(screen.getByRole("status")).toHaveTextContent("Analyzing code…");
  });

  it("announces failure assertively via role=alert", () => {
    render(
      <ResultsPanel
        status="error"
        analysis={null}
        error="Rate limit exceeded."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Analysis failed. Rate limit exceeded.",
    );
  });

  it("keeps both live regions silent while idle", () => {
    render(<ResultsPanel status="idle" analysis={null} />);
    expect(screen.getByRole("status").textContent).toBe("");
    expect(screen.getByRole("alert").textContent).toBe("");
  });
});
