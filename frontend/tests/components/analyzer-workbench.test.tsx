/**
 * Integration tests for AnalyzerWorkbench orchestration.
 *
 * Monaco can't run in jsdom so CodeEditor is stubbed with a plain <textarea>.
 * fetch is stubbed via vi.stubGlobal so network calls never hit the network.
 * The 650ms MIN_SCAN_MS floor is handled by using real timers and a generous
 * waitFor timeout — fake timers interact poorly with React's scheduler in jsdom.
 *
 * Covers: initial state, language switch, sample selection, double-trigger guard,
 * Ctrl/⌘+Enter keyboard shortcut, successful analysis, HTTP error, network error.
 */

import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Module mocks (hoisted before imports) ──────────────────────────────────────

// Monaco can't initialise in jsdom — stub CodeEditor with a textarea so tests
// can inspect the buffer value and trigger keyboard shortcuts.
vi.mock("@/components/analyzer/code-editor", () => ({
  CodeEditor: vi.fn(
    ({
      value,
      onChange,
      onRun,
    }: {
      value: string;
      onChange: (v: string) => void;
      onRun?: () => void;
    }) => (
      <textarea
        data-testid="code-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onRun?.();
        }}
      />
    ),
  ),
}));

vi.mock("@/components/analyzer/intro-strip", () => ({
  IntroStrip: vi.fn(() => null),
}));

vi.mock("@/components/analyzer/save-actions", () => ({
  SaveActions: vi.fn(() => <div data-testid="save-actions" />),
}));

// ── Imports ────────────────────────────────────────────────────────────────────

import { AnalyzerWorkbench } from "@/components/analyzer/analyzer-workbench";
import { SAMPLES } from "@/lib/analysis/samples";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MOCK_ANALYSIS = {
  time: { notation: "O(n)", tier: "good", reason: "Single loop." },
  space: { notation: "O(1)", tier: "optimal", reason: "No extra allocation." },
  verdict: "Linear time, constant space.",
  notes: [],
  metrics: [],
  confidence: 0.9,
  provider: "mock",
};

function mockFetchOk() {
  (global.fetch as Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ analysis: MOCK_ANALYSIS }),
  });
}

function mockFetchError(status = 429, message = "Rate limit exceeded.") {
  (global.fetch as Mock).mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  });
}

function mockFetchNetworkError() {
  (global.fetch as Mock).mockRejectedValue(new Error("Network failure"));
}

function getAnalyzeButton() {
  return screen.getByRole("button", { name: /analyze/i });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

// The analysis flow tests wait for the real 650ms MIN_SCAN_MS floor to pass.
// Using a waitFor timeout of 2000ms leaves plenty of headroom within the
// 5-second test default.
const ANALYSIS_TIMEOUT = 2000;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Initial state and controls (fast, no fetch needed) ────────────────────────

describe("AnalyzerWorkbench — initial state and controls", () => {
  it("renders the Analyze button and editor with the initial sample preloaded", () => {
    render(<AnalyzerWorkbench />);
    expect(getAnalyzeButton()).not.toBeDisabled();
    const editor = screen.getByTestId("code-editor") as HTMLTextAreaElement;
    expect(editor.value).toBe(SAMPLES.typescript[0].code);
  });

  it("language switch preserves the current code buffer", async () => {
    const user = userEvent.setup();
    render(<AnalyzerWorkbench initialLanguage="typescript" />);

    const initialCode = (screen.getByTestId("code-editor") as HTMLTextAreaElement).value;

    const langSelect = screen.getByRole("combobox", { name: /language/i });
    await user.selectOptions(langSelect, "python");

    // Code must be unchanged — switching language re-highlights, never clobbers.
    expect((screen.getByTestId("code-editor") as HTMLTextAreaElement).value).toBe(initialCode);
  });

  it("sample selection loads the chosen sample's code", async () => {
    const user = userEvent.setup();
    render(<AnalyzerWorkbench initialLanguage="typescript" />);

    const secondSample = SAMPLES.typescript[1];
    const sampleSelect = screen.getByRole("combobox", { name: /sample/i });
    await user.selectOptions(sampleSelect, secondSample.id);

    expect((screen.getByTestId("code-editor") as HTMLTextAreaElement).value).toBe(
      secondSample.code,
    );
  });
});

// ── Analysis flow ─────────────────────────────────────────────────────────────

describe("AnalyzerWorkbench — analysis flow", () => {
  it("double-trigger guard: second call while analyzing is silently dropped (ANL-09)", async () => {
    // Never-resolving fetch keeps the component stuck in "analyzing" indefinitely.
    (global.fetch as Mock).mockReturnValue(new Promise(() => {}));
    render(<AnalyzerWorkbench />);

    // First trigger: button click.
    fireEvent.click(getAnalyzeButton());
    await act(async () => {}); // flush setStatus("analyzing")

    // Second trigger: keyboard shortcut while status === "analyzing".
    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true, bubbles: true });
    await act(async () => {});

    // fetch must have been called exactly once.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+Enter on the window triggers an analysis when idle", async () => {
    mockFetchOk();
    render(<AnalyzerWorkbench />);

    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true, bubbles: true });

    await waitFor(
      () => expect(screen.getByText("Linear time, constant space.")).toBeInTheDocument(),
      { timeout: ANALYSIS_TIMEOUT },
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows the done state and analysis result after a successful analysis", async () => {
    mockFetchOk();
    render(<AnalyzerWorkbench />);

    fireEvent.click(getAnalyzeButton());

    await waitFor(
      () => expect(screen.getByText("Linear time, constant space.")).toBeInTheDocument(),
      { timeout: ANALYSIS_TIMEOUT },
    );
    expect(screen.getByTestId("save-actions")).toBeInTheDocument();
  });

  it("surfaces an HTTP error response in the error state", async () => {
    mockFetchError(429, "Rate limit exceeded.");
    render(<AnalyzerWorkbench />);

    fireEvent.click(getAnalyzeButton());

    await waitFor(
      () => expect(screen.getByText("Analysis failed")).toBeInTheDocument(),
      { timeout: ANALYSIS_TIMEOUT },
    );
    expect(screen.getByText("Rate limit exceeded.")).toBeInTheDocument();
  });

  it("surfaces a network error in the error state", async () => {
    mockFetchNetworkError();
    render(<AnalyzerWorkbench />);

    fireEvent.click(getAnalyzeButton());

    // Network errors cause Promise.all to reject immediately (no 650ms floor)
    // so waitFor finds the error state quickly.
    await waitFor(
      () => expect(screen.getByText("Analysis failed")).toBeInTheDocument(),
      { timeout: ANALYSIS_TIMEOUT },
    );
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });
});
