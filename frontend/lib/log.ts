/**
 * Minimal structured logger. One JSON object per line on stdout — Vercel
 * captures this as searchable runtime logs (Project → Logs).
 *
 * Privacy rule: NEVER log submitted code or other user content. Identifiers
 * (Clerk user ids) and metadata (language, sizes, durations) only.
 */
export function logEvent(
  event: string,
  data: Record<string, unknown> = {},
): void {
  try {
    console.log(
      JSON.stringify({ ts: new Date().toISOString(), event, ...data }),
    );
  } catch {
    console.log(JSON.stringify({ ts: new Date().toISOString(), event }));
  }
}
