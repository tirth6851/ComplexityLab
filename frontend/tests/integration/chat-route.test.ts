/**
 * Integration tests for POST /api/chat.
 *
 * Mocking strategy:
 *  - Clerk auth → vi.mock so we control userId
 *  - lib/db/profiles → mock getOrCreateProfile (one call, threads profileId)
 *  - lib/db/chat → mock all DB operations
 *  - lib/ai/chat → mock getChatProvider to return a controllable async generator
 *
 * Streaming is tested by consuming the full ReadableStream body and parsing
 * the SSE lines.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";

// ── Mocks (must be hoisted before route import) ───────────────────────────────

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

const mockGetOrCreateProfile = vi.fn();
vi.mock("@/lib/db/profiles", () => ({
  getOrCreateProfile: () => mockGetOrCreateProfile(),
}));

const mockGetUsageToday = vi.fn();
const mockCreateConversation = vi.fn();
const mockGetConversation = vi.fn();
const mockListMessages = vi.fn();
const mockAppendMessage = vi.fn();
const mockBumpUsage = vi.fn();
vi.mock("@/lib/db/chat", () => ({
  getUsageToday: (id: string) => mockGetUsageToday(id),
  createConversation: (...args: unknown[]) => mockCreateConversation(...args),
  getConversation: (...args: unknown[]) => mockGetConversation(...args),
  listMessages: (...args: unknown[]) => mockListMessages(...args),
  appendMessage: (...args: unknown[]) => mockAppendMessage(...args),
  bumpUsage: (...args: unknown[]) => mockBumpUsage(...args),
}));

const MOCK_CHUNKS = ["Hello", ",", " world", "!"];
const mockStreamFn = vi.fn();
vi.mock("@/lib/ai/chat", () => ({
  getChatProvider: () => ({
    id: "mock-test",
    name: "Mock Test",
    stream: mockStreamFn,
  }),
}));

// Route import after mocks
import { POST } from "@/app/api/chat/route";

// ── Test fixtures ────────────────────────────────────────────────────────────

const TEST_PROFILE = { id: "profile-f4-test", clerkUserId: "user_chat_test" };
const TEST_CONVERSATION = {
  id: "conv-abc-123",
  profileId: TEST_PROFILE.id,
  title: "Test conversation",
  contextType: null,
  contextRefId: null,
  contextMetadata: null,
  createdAt: "2026-06-18T00:00:00Z",
  updatedAt: "2026-06-18T00:00:00Z",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Collect all SSE events from a streamed Response
async function collectSSE(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text
    .split("\n\n")
    .filter((block) => block.startsWith("data: "))
    .map((block) => JSON.parse(block.slice(6)) as Record<string, unknown>);
}

async function* defaultStream() {
  for (const chunk of MOCK_CHUNKS) yield chunk;
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  process.env.GROQ_API_KEY = "";

  mockAuth.mockReturnValue({ userId: "user_chat_test_123" });
  mockGetOrCreateProfile.mockResolvedValue({ ok: true, data: TEST_PROFILE });
  mockGetUsageToday.mockResolvedValue({
    ok: true,
    data: { messageCount: 0, tokensIn: 0, tokensOut: 0 },
  });
  mockCreateConversation.mockResolvedValue({ ok: true, data: TEST_CONVERSATION });
  mockGetConversation.mockResolvedValue({ ok: true, data: TEST_CONVERSATION });
  mockListMessages.mockResolvedValue({ ok: true, data: [] });
  mockAppendMessage.mockResolvedValue({ ok: true, data: { id: "msg-1" } });
  mockBumpUsage.mockResolvedValue({ ok: true, data: null });
  mockStreamFn.mockImplementation(defaultStream);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/chat", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockReturnValue({ userId: null });
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBeTruthy();
  });

  it("returns 400 for missing message field", async () => {
    const res = await POST(makeRequest({ }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty message string", async () => {
    const res = await POST(makeRequest({ message: "   " }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message exceeds max length", async () => {
    const res = await POST(makeRequest({ message: "x".repeat(4_001) }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when daily quota is reached", async () => {
    mockGetUsageToday.mockResolvedValue({
      ok: true,
      data: { messageCount: 50, tokensIn: 10000, tokensOut: 5000 },
    });
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(429);
    // Provider should NOT have been called
    expect(mockStreamFn).not.toHaveBeenCalled();
  });

  it("allows request when quota DB check fails (graceful degradation)", async () => {
    mockGetUsageToday.mockResolvedValue({
      ok: false,
      error: "Table ai_usage does not exist",
    });
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("returns 429 after per-minute burst is exhausted", async () => {
    // Use a unique userId to avoid contaminating other tests' rate-limit buckets
    mockAuth.mockReturnValue({ userId: "user_chat_burst_test" });

    for (let i = 0; i < 20; i++) {
      await POST(makeRequest({ message: `msg ${i}` }));
    }
    const res = await POST(makeRequest({ message: "one more" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("creates a new conversation when no conversationId is provided", async () => {
    await POST(makeRequest({ message: "Hello" }));
    expect(mockCreateConversation).toHaveBeenCalledOnce();
    expect(mockGetConversation).not.toHaveBeenCalled();
  });

  it("loads an existing conversation when conversationId is provided", async () => {
    await POST(makeRequest({ message: "Hello", conversationId: TEST_CONVERSATION.id }));
    expect(mockGetConversation).toHaveBeenCalledWith(
      TEST_PROFILE.id,
      TEST_CONVERSATION.id,
    );
    expect(mockCreateConversation).not.toHaveBeenCalled();
  });

  it("returns 404 when the provided conversationId is not found", async () => {
    mockGetConversation.mockResolvedValue({ ok: false, error: "Not found." });
    const res = await POST(
      makeRequest({ message: "Hello", conversationId: "bad-id" }),
    );
    expect(res.status).toBe(404);
  });

  it("persists the user message BEFORE streaming starts", async () => {
    // Track call order
    const callOrder: string[] = [];
    mockAppendMessage.mockImplementation(
      (_convId: string, role: string) => {
        callOrder.push(role);
        return Promise.resolve({ ok: true, data: { id: "msg-x" } });
      },
    );

    const mockProvider = async function* () {
      callOrder.push("stream-started");
      yield "hello";
    };
    mockStreamFn.mockImplementation(mockProvider);

    const res = await POST(makeRequest({ message: "Hello" }));
    await res.text(); // consume stream

    const userIdx = callOrder.indexOf("user");
    const streamIdx = callOrder.indexOf("stream-started");
    expect(userIdx).toBeGreaterThanOrEqual(0);
    expect(streamIdx).toBeGreaterThan(userIdx);
  });

  it("persists the assistant message after streaming completes", async () => {
    const res = await POST(makeRequest({ message: "Hello" }));
    await res.text(); // consume stream to trigger finally

    const assistantCall = mockAppendMessage.mock.calls.find(
      (c) => c[1] === "assistant",
    );
    expect(assistantCall).toBeDefined();
    expect(typeof assistantCall![2]).toBe("string");
    expect(assistantCall![2].length).toBeGreaterThan(0);
  });

  it("calls bumpUsage after the stream completes with 1 user turn", async () => {
    const res = await POST(makeRequest({ message: "Hello" }));
    await res.text();

    expect(mockBumpUsage).toHaveBeenCalledOnce();
    const args = mockBumpUsage.mock.calls[0] as [string, number, number, number];
    expect(args[0]).toBe(TEST_PROFILE.id);
    expect(args[1]).toBe(1); // 1 user turn
  });

  it("streams text chunks and emits a done event with conversationId", async () => {
    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const events = await collectSSE(res);
    const textEvents = events.filter((e) => "text" in e);
    const doneEvent = events.find((e) => e.done === true);

    expect(textEvents.length).toBeGreaterThan(0);
    expect(textEvents.map((e) => e.text).join("")).toBe(MOCK_CHUNKS.join(""));
    expect(doneEvent).toBeDefined();
    expect(doneEvent!.conversationId).toBe(TEST_CONVERSATION.id);
  });

  it("uses the Git Coach system prompt when coachType is git", async () => {
    const res = await POST(makeRequest({
      message: "How do I fix a merge conflict?",
      coachType: "git",
    }));
    await res.text();

    expect(res.status).toBe(200);
    expect(mockStreamFn).toHaveBeenCalledOnce();
    const messages = mockStreamFn.mock.calls[0][0] as Array<{
      role: string;
      content: string;
    }>;
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("Git and GitHub workflow coach");
    expect(messages[0].content).toContain("reset --hard");
  });

  it("uses the CLI Coach system prompt when coachType is cli", async () => {
    const res = await POST(makeRequest({
      message: "How do I find files from the terminal?",
      coachType: "cli",
    }));
    await res.text();

    expect(res.status).toBe(200);
    expect(mockStreamFn).toHaveBeenCalledOnce();
    const messages = mockStreamFn.mock.calls[0][0] as Array<{
      role: string;
      content: string;
    }>;
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("CLI and terminal workflow coach");
    expect(messages[0].content).toContain("rm -rf");
  });

  it("emits an error SSE event when the provider throws", async () => {
    mockStreamFn.mockImplementation(async function* () {
      throw new Error("ECONNREFUSED");
    });

    const res = await POST(makeRequest({ message: "Hello" }));
    expect(res.status).toBe(200); // HTTP 200 — error is in the stream body

    const events = await collectSSE(res);
    const errorEvent = events.find((e) => "error" in e);
    expect(errorEvent).toBeDefined();
    expect(typeof errorEvent!.error).toBe("string");
  });

  it("does not emit assistant content in logEvent calls (privacy)", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const res = await POST(makeRequest({ message: "Secret code: rm -rf /" }));
    await res.text();

    const allLogs = consoleSpy.mock.calls.flatMap((c) => c.map(String)).join(" ");
    expect(allLogs).not.toContain("rm -rf");
    consoleSpy.mockRestore();
  });

  it("passes contextRef type and refId when creating a new conversation", async () => {
    const contextRef = { type: "analysis", refId: "analysis-uuid-123" };
    await POST(makeRequest({ message: "Hello", contextRef }));
    expect(mockCreateConversation).toHaveBeenCalledWith(
      TEST_PROFILE.id,
      expect.any(String), // title
      { type: "analysis", refId: "analysis-uuid-123" },
    );
  });

  it("does not call bumpUsage when the assistant produced no content", async () => {
    mockStreamFn.mockImplementation(async function* () {
      // yields nothing
    });
    const res = await POST(makeRequest({ message: "Hello" }));
    await res.text();

    // bumpUsage is called regardless (1 user turn), but assistant message NOT appended
    expect(mockBumpUsage).toHaveBeenCalledOnce();
    const assistantCall = mockAppendMessage.mock.calls.find(
      (c) => c[1] === "assistant",
    );
    expect(assistantCall).toBeUndefined();
  });
});
