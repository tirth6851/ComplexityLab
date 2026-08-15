import { SITE_SEARCH_INDEX, type SiteSearchEntry } from "./site-index";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Keyword-overlap score: whole-query substring hits outrank per-token hits; title outranks description. */
function scoreEntry(query: string, queryTokens: string[], entry: SiteSearchEntry): number {
  const title = entry.title.toLowerCase();
  const description = entry.description.toLowerCase();
  let score = 0;

  if (title.includes(query)) score += 10;
  if (description.includes(query)) score += 5;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 3;
    if (description.includes(token)) score += 1;
  }

  return score;
}

/**
 * Ranks the static site index against a query via local keyword-overlap
 * scoring — no AI, no network, pure client-side search over title + description.
 */
export function searchSite(
  rawQuery: string,
  entries: SiteSearchEntry[] = SITE_SEARCH_INDEX,
  limit = 8,
): SiteSearchEntry[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return entries
    .map((entry) => ({ entry, score: scoreEntry(query, queryTokens, entry) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);
}
