import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatShell } from "@/components/chat/chat-shell";

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ── SSE body helpers ─────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function makeSSEBody(events: Record<string, unknown>[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      }
      controller.close();
    },
  });
}

function sseResponse(events: Record<string, unknown>[]) {
  return new Response(makeSSEBody(events), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), { status });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeAndSend(value: string) {
  const textarea = screen.getByLabelText("Message");
  fireEvent.change(textarea, { target: { value } });
  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ChatShell", () => {
  // Static / synchronous state

  it("renders empty-state prompt when no messages exist", () => {
    render(<ChatShell />);
    expect(
      screen.getByText(/ask anything about algorithms/i),
    ).toBeInTheDocument();
  });

  it("shows the Groq + quota hint in the empty state", () => {
    render(<ChatShell />);
    expect(screen.getByText(/50 messages\/day/i)).toBeInTheDocument();
  });

  it("updates input as the user types", () => {
    render(<ChatShell />);
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Hello" },
    });
    expect(screen.getByLabelText("Message")).toHaveValue("Hello");
  });

  it("Send button is disabled when input is empty", () => {
    render(<ChatShell />);
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("Send button is enabled when input has content", () => {
    render(<ChatShell />);
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Hello" },
    });
    expect(screen.getByLabelText("Send message")).not.toBeDisabled();
  });

  it("Shift+Enter does not submit — only inserts a newline intent", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatShell />);
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "line1" },
    });
    fireEvent.keyDown(screen.getByLabelText("Message"), {
      key: "Enter",
      shiftKey: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Async submission

  it("shows the user message immediately after submitting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([{ text: "Hi!" }, { done: true, conversationId: "c1" }]),
      ),
    );

    render(<ChatShell />);
    typeAndSend("Hello world");

    // User message is appended synchronously before the fetch resolves
    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("clears the input field immediately after submitting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([{ done: true, conversationId: "c1" }]),
      ),
    );

    render(<ChatShell />);
    typeAndSend("Hello");

    await waitFor(() => {
      expect(screen.getByLabelText("Message")).toHaveValue("");
    });
  });

  it("appends streamed text chunks into the assistant message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([
          { text: "Big-O" },
          { text: " is O(n)." },
          { done: true, conversationId: "c1" },
        ]),
      ),
    );

    render(<ChatShell />);
    typeAndSend("What is Big-O?");

    await waitFor(
      () => {
        expect(screen.getByText("Big-O is O(n).")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("re-enables the composer input after streaming completes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([{ text: "Done." }, { done: true, conversationId: "c1" }]),
      ),
    );

    render(<ChatShell />);
    typeAndSend("Hello");

    // While streaming, textarea is disabled
    await waitFor(() => {
      expect(screen.getByLabelText("Message")).toBeDisabled();
    });

    // After streaming completes, textarea is re-enabled
    await waitFor(
      () => {
        expect(screen.getByLabelText("Message")).not.toBeDisabled();
      },
      { timeout: 3000 },
    );
  });

  it("shows an error alert when the API returns a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(429, "Daily limit reached.")),
    );

    render(<ChatShell />);
    typeAndSend("Hello");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Daily limit reached.",
      );
    });
  });

  it("shows an error alert when the SSE stream emits an error event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([
          { error: "The AI encountered an error. Please try again." },
        ]),
      ),
    );

    render(<ChatShell />);
    typeAndSend("Hello");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("removes the empty assistant placeholder on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    render(<ChatShell />);
    typeAndSend("Hello");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // User message stays; no empty assistant bubble
    expect(screen.getByText("Hello")).toBeInTheDocument();
    const bubbles = document.querySelectorAll("[class*='rounded-ds-lg px-3']");
    expect(bubbles.length).toBe(1);
  });

  it("calls fetch with conversationId on the second message", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([{ text: "Reply" }, { done: true, conversationId: "conv-1" }]),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatShell />);
    typeAndSend("First message");

    // Wait for first exchange to complete so conversationId is saved
    await waitFor(
      () => {
        expect(screen.getByLabelText("Message")).not.toBeDisabled();
      },
      { timeout: 3000 },
    );

    // Reset mock to a new response for the second call
    fetchMock.mockResolvedValue(
      sseResponse([{ text: "Reply 2" }, { done: true, conversationId: "conv-1" }]),
    );

    typeAndSend("Second message");

    await waitFor(() => {
      // mock.calls is an array of arg-arrays: [[url, init], [url, init], ...]
      const secondArgs = fetchMock.mock.calls[1] as [string, RequestInit];
      const body = JSON.parse(secondArgs[1].body as string) as {
        conversationId?: string;
      };
      expect(body.conversationId).toBe("conv-1");
    });
  });
});
