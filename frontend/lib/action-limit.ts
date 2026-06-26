import "server-only";

import { auth } from "@clerk/nextjs/server";
import { logEvent } from "./log";
import { rateLimit, type RateLimitOptions } from "./rate-limit";

/**
 * Per-user rate-limit guard for Server Actions. Returns a user-facing error
 * string when the caller is over the limit (or signed out), else null.
 *
 * WHY this exists separately from the route-handler rateLimit() calls:
 * Server Actions are invoked over a special Next.js internal endpoint and
 * bypass proxy.ts's route matching — they never hit a Route Handler. Without
 * this guard, a user could spam save/delete actions without any throttle.
 * Always call this as the very first line of any Server Action.
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
