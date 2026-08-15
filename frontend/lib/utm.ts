/**
 * UTM parameter capture — first-touch marketing attribution.
 *
 * Campaign links (email, ads, social posts) append `utm_*` query params.
 * Marketing convention credits the *first* campaign that brought a visitor
 * in ("first-touch attribution"), not the last one before signup. This
 * module extracts those params on landing and persists them in
 * localStorage so they survive across pages within the 30-day window.
 *
 * HONEST STATUS: this is capture-only infrastructure. Nothing in the
 * codebase reads `getStoredUtmParams()` yet — there is no analytics or
 * attribution backend wired up. Params are captured and stored, full
 * stop; they are not sent anywhere, attached to a profile, or logged.
 * This exists so that work is ready to plug in once an analytics
 * pipeline lands, per the project's "no mock data" rule this module
 * makes no claim to be doing more than it is.
 *
 * Deliberately NOT `server-only`: capture happens client-side, reading
 * `window.location.search` and `window.localStorage` in the browser.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

export type UtmParams = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "cl-utm-v1";

// 30 days: long enough to cover a slow signup funnel, short enough that a
// months-old campaign link stops getting credit for an unrelated return visit.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredUtm {
  params: UtmParams;
  capturedAt: number;
}

function isUtmKey(key: string): key is UtmKey {
  return (UTM_KEYS as readonly string[]).includes(key);
}

// Runtime guard for whatever JSON.parse hands back — localStorage can be
// edited by extensions or hold a stale shape from a previous schema version,
// so this is not just a TypeScript formality.
function isStoredUtm(value: unknown): value is StoredUtm {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.capturedAt !== "number") return false;
  if (typeof record.params !== "object" || record.params === null) return false;
  return Object.entries(record.params as Record<string, unknown>).every(
    ([key, val]) => isUtmKey(key) && typeof val === "string",
  );
}

/**
 * Extract recognized `utm_*` params from a query string (with or without a
 * leading `?`) or an existing `URLSearchParams`. Returns `null` — not an
 * empty object — when none of the five params are present, so callers can
 * treat "nothing to capture" as a single falsy check. Blank values (e.g.
 * `?utm_source=`) are treated as absent, same as a missing key.
 */
export function parseUtmParams(search: URLSearchParams | string): UtmParams | null {
  const query = typeof search === "string" ? new URLSearchParams(search) : search;
  const result: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = query.get(key);
    if (value) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function readStored(): StoredUtm | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  return isStoredUtm(parsed) ? parsed : null;
}

/**
 * Read the stored first-touch UTM params. Returns `null` if nothing was
 * ever captured, the entry is past the 30-day TTL, or storage can't be
 * read for any reason (private browsing, disabled storage, corrupt JSON,
 * a stale schema from an old `cl-utm-v1` shape). Never throws.
 */
export function getStoredUtmParams(): UtmParams | null {
  try {
    const stored = readStored();
    if (!stored) return null;
    if (Date.now() - stored.capturedAt > TTL_MS) return null;
    return stored.params;
  } catch {
    return null;
  }
}

/**
 * Persist captured UTM params under a first-touch model: an existing
 * stored value that hasn't expired yet is left alone, so the campaign
 * that first brought the visitor in keeps attribution credit rather than
 * being overwritten by whatever link they clicked most recently. An
 * absent or expired stored value is freely overwritten.
 *
 * `now` is injectable for deterministic tests; defaults to the real clock.
 * All storage access is try/caught — private browsing, disabled storage,
 * or quota errors must never throw out of here.
 */
export function storeUtmParams(params: UtmParams, now: number = Date.now()): void {
  try {
    const existing = readStored();
    if (existing && now - existing.capturedAt <= TTL_MS) return;

    const record: StoredUtm = { params, capturedAt: now };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable or over quota — capture is best-effort and must
    // never break the page it's mounted on.
  }
}
