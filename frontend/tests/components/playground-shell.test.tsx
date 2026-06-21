/**
 * Tests for PlaygroundShell — code execution UI.
 *
 * Monaco can't run in jsdom so CodeEditor is stubbed as a plain <textarea>.
 * fetch is stubbed via vi.stubGlobal. Real timers throughout — fake timers
 * deadlock React's scheduler in jsdom.
 */

import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";

// ── Module mocks (hoisted) ────────────────────────────────────────────────────

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
        aria-label="Code editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onRun?.();
        }}
      />
    ),
  ),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { PlaygroundShell } from "@/components/playground/playground-shell";
import type { ExecutionResult } from "@/lib/execute/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function okResult(partial: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    status: "accepted",
    statusLabel: "Accepted",
    stdout: "Hello, World!\n",
    stderr: null,
    compileOutput: null,
    timeMs: 42,
    memoryKb: 4096,
    ...partial,
  };
}

function getRunButton() {
  return screen.getByRole("button", { name: /^run/i });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PlaygroundShell — static state", () => {
  it("renders the language selector", () => {
    render(<PlaygroundShell />);
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
  });

  it("shows idle output panel on initial render", () => {
    render(<PlaygroundShell />);
    expect(screen.getByText("No output yet")).toBeInTheDocument();
  });

  it("Run button is present and enabled with default starter code", () => {
    render(<PlaygroundShell />);
    expect(getRunButton()).not.toBeDisabled();
  });

  it("Run button is disabled when code editor is empty", () => {
    render(<PlaygroundShell />);
    fireEvent.change(screen.getByTestId("code-editor"), { target: { value: "" } });
    expect(getRunButton()).toBeDisabled();
  });

  it("stdin panel is hidden initially", () => {
    render(<PlaygroundShell />);
    expect(screen.queryByLabelText("Standard input")).toBeNull();
  });

  it("stdin panel toggles open and closed", () => {
    render(<PlaygroundShell />);
    const toggle = screen.getByRole("button", { name: /stdin/i });
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Standard input")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByLabelText("Standard input")).toBeNull();
  });
});

describe("PlaygroundShell — execution flow", () => {
  it("shows Running… while fetch is pending", async () => {
    (global.fetch as Mock).mockReturnValue(new Promise(() => {}));
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await act(async () => {}); // flush state update to "running"
    // Both the panel paragraph and the button label read "Running…"
    expect(screen.getAllByText("Running…").length).toBeGreaterThanOrEqual(1);
  });

  it("Run button shows Running… and is disabled while executing", async () => {
    (global.fetch as Mock).mockReturnValue(new Promise(() => {}));
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await act(async () => {}); // flush state update to "running"
    expect(getRunButton()).toBeDisabled();
    expect(getRunButton()).toHaveTextContent("Running…");
  });

  it("shows Accepted status and stdout after a successful run", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ result: okResult({ stdout: "Hello, World!\n" }) }),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("Accepted")).toBeInTheDocument();
    });
    expect(screen.getByText(/Hello, World!/)).toBeInTheDocument();
  });

  it("shows timing metadata after a successful run", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ result: okResult({ timeMs: 37, memoryKb: 8192 }) }),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("37ms")).toBeInTheDocument();
    });
  });

  it("shows Compilation Error status and compiler output", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({
        result: okResult({
          status: "compile_error",
          statusLabel: "Compilation Error",
          stdout: null,
          compileOutput: "SyntaxError: invalid syntax on line 2",
          timeMs: null,
          memoryKb: null,
        }),
      }),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("Compilation Error")).toBeInTheDocument();
    });
    expect(screen.getByText(/SyntaxError/)).toBeInTheDocument();
  });

  it("shows Runtime Error status and stderr", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({
        result: okResult({
          status: "runtime_error",
          statusLabel: "Runtime Error",
          stdout: null,
          stderr: "ZeroDivisionError: division by zero",
          timeMs: null,
          memoryKb: null,
        }),
      }),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("Runtime Error")).toBeInTheDocument();
    });
    expect(screen.getByText(/ZeroDivisionError/)).toBeInTheDocument();
  });

  it("re-enables Run button and returns to idle-like state after run completes", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ result: okResult() }),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("Accepted")).toBeInTheDocument();
    });
    expect(getRunButton()).not.toBeDisabled();
    expect(getRunButton()).toHaveTextContent("Run");
  });

  it("Ctrl+Enter on the window triggers execution", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ result: okResult() }),
    );
    render(<PlaygroundShell />);
    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true, bubbles: true });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("includes stdin in the request body when provided", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ result: okResult() }),
    );
    render(<PlaygroundShell />);

    // Open stdin panel and enter input
    fireEvent.click(screen.getByRole("button", { name: /stdin/i }));
    fireEvent.change(screen.getByLabelText("Standard input"), {
      target: { value: "42\n" },
    });

    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [, init] = (global.fetch as Mock).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { stdin?: string };
    expect(body.stdin).toBe("42\n");
  });
});

describe("PlaygroundShell — error handling", () => {
  it("shows rate-limit message on 429", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ error: "Daily execution limit reached (100 runs)." }, 429),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText(/daily execution limit/i)).toBeInTheDocument();
    });
  });

  it("shows auth error message on 401", async () => {
    (global.fetch as Mock).mockResolvedValue(
      jsonResponse({ error: "Sign in to run code." }, 401),
    );
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText(/sign in to run code/i)).toBeInTheDocument();
    });
  });

  it("shows error message on fetch network failure", async () => {
    (global.fetch as Mock).mockRejectedValue(new Error("Network error"));
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("Run button is re-enabled after a fetch error", async () => {
    (global.fetch as Mock).mockRejectedValue(new Error("Network error"));
    render(<PlaygroundShell />);
    fireEvent.click(getRunButton());
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
    expect(getRunButton()).not.toBeDisabled();
  });
});
