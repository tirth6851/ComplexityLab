import { KNOWLEDGE_BASE, type KnowledgeChunk } from "./knowledge-base";

// Words too short or too common to be useful for retrieval.
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
  "how", "its", "let", "may", "now", "old", "see", "two", "way", "who",
  "did", "use", "this", "that", "with", "from", "they", "than", "then",
  "when", "also", "into", "have", "more", "what", "like", "some", "time",
  "been", "were", "will", "just", "each", "code", "which", "very", "even",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t)),
  );
}

function scoreChunk(queryTokens: Set<string>, chunk: KnowledgeChunk): number {
  let score = 0;
  for (const tag of chunk.tags) {
    const tagTokens = tokenize(tag);
    for (const qt of queryTokens) {
      if (tag === qt || tag.includes(qt) || qt.includes(tag)) score += 2;
      for (const tt of tagTokens) {
        if (tt === qt) score += 1;
      }
    }
  }
  // Bonus for title matches
  for (const qt of queryTokens) {
    if (chunk.title.toLowerCase().includes(qt)) score += 1;
  }
  return score;
}

/**
 * Retrieve the top-K most relevant knowledge chunks for a given query.
 * Returns an empty array when no chunk scores above zero.
 */
export function retrieveContext(query: string, topK = 3): KnowledgeChunk[] {
  if (!query.trim()) return [];
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return [];

  return KNOWLEDGE_BASE.map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.chunk);
}
