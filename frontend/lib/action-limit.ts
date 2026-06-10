import "server-only";

import { auth } from "@clerk/nextjs/server";
import { logEvent } from "./log";
import { rateLimit, type RateLimitOptions } from "./rate-limit";

/**
 * Per-user rate-limit guard for Server Actions. Returns a user-facing error
 * string when the caller is over the limit (or signed out), else null.
 */
export async function checkActionLimit(
  action: string,
  options: RateLimitOptions,
): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return "Not signed in.";

  const res = rateLimit(`${action}:${userId}`, options);
  if (!res.ok) {
    const seconds = Math.max(1, Math.ceil(res.retryAfterMs / 1000));
    logEvent("rate_limited", { action, userId, retryAfterMs: res.retryAfterMs });
    return `Slow down — too many requests. Try again in ${seconds}s.`;
  }
  return null;
}
