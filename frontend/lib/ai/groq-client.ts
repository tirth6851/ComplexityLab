// Shared Groq HTTP client — handles auth, model selection, timeout, and
// error normalization for all Groq-backed AI features.
//
// Providers import this instead of duplicating the fetch boilerplate.
// Server-only by construction: GROQ_API_KEY never leaves the server.

/** OpenAI-compatible Groq chat completions endpoint. */
export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Default model for analysis; overridden by the GROQ_MODEL env var. */
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/** Default model for chat; overridden by the CHAT_MODEL env var.
 *  Separate from GROQ_MODEL so analysis and chat can be tuned independently. */
export const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqCompleteOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  responseFormat?: { type: "json_object" | "text" };
  /** Optional external AbortSignal (e.g. from a route handler's own timeout). */
  signal?: AbortSignal;
}

export interface GroqStreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Called once when Groq's usage object arrives (final SSE chunk).
   *  Use for best-effort token accounting. */
  onUsage?: (tokensIn: number, tokensOut: number) => void;
}

/**
 * POST to Groq chat completions and return the first choice's content string.
 *
 * Throws on:
 *  - Timeout or external abort  → AbortError
 *  - Non-2xx response           → Error("groq_http_<status>")
 *  - Empty completion content   → Error("groq_empty_content")
 *  - Network / parse failure    → original error from fetch
 *
 * Callers must catch all cases and map to their own fallback/error strategies.
 */
export async function groqComplete(
  messages: GroqMessage[],
  opts: GroqCompleteOptions = {},
): Promise<string> {
  const {
    model = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL,
    temperature = 0,
    maxTokens = 800,
    timeoutMs = 20_000,
    responseFormat,
    signal: externalSignal,
  } = opts;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`groq_http_${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("groq_empty_content");
    return content;
  } finally {
    clearTimeout(timerId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Stream Groq chat completions as an async generator of text deltas.
 *
 * Uses `stream_options.include_usage: true` so the final SSE chunk carries
 * Groq's actual token counts — passed to `opts.onUsage` if provided.
 * Callers should fall back to char/4 estimates if `onUsage` is never called.
 *
 * Throws on:
 *  - Timeout or external abort  → AbortError
 *  - Non-2xx response           → Error("groq_http_<status>")
 *  - Network failure            → original fetch error
 */
export async function* groqStream(
  messages: GroqMessage[],
  opts: GroqStreamOptions = {},
): AsyncGenerator<string, void, unknown> {
  const {
    model = process.env.CHAT_MODEL ?? DEFAULT_CHAT_MODEL,
    temperature = 0.7,
    maxTokens = 1024,
    timeoutMs = 30_000,
    signal: externalSignal,
    onUsage,
  } = opts;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
        messages,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`groq_http_${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;

          const chunk = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[];
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };

          const text = chunk.choices?.[0]?.delta?.content;
          if (text) yield text;

          if (chunk.usage && onUsage) {
            onUsage(chunk.usage.prompt_tokens ?? 0, chunk.usage.completion_tokens ?? 0);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } finally {
    clearTimeout(timerId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}
