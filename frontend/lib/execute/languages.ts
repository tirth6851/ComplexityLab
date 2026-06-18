/**
 * Maps app language IDs → Judge0 CE language IDs for RapidAPI.
 *
 * IMPORTANT: Judge0 language IDs differ between Judge0 versions and hosting
 * providers. These IDs target Judge0 CE on RapidAPI (judge0-ce.p.rapidapi.com).
 * Before deploying, verify them against the live /languages endpoint:
 *   GET https://judge0-ce.p.rapidapi.com/languages
 *
 * This map is intentionally separate from lib/analysis/languages.ts so that
 * execution support can diverge from analysis support in the future.
 */
export const JUDGE0_LANGUAGES: Record<string, number> = {
  python:     71,  // Python 3.8.1
  javascript: 93,  // JavaScript (Node.js 18.15.0)
  typescript: 94,  // TypeScript 5.0.3
  java:       62,  // Java (OpenJDK 13.0.1)
  go:         60,  // Go (1.13.5)
  rust:       73,  // Rust (1.40.0)
  cpp:        54,  // C++ (GCC 9.2.0)
};

/** Returns true when the language ID is supported for execution. */
export function isExecutable(languageId: string): boolean {
  return Object.prototype.hasOwnProperty.call(JUDGE0_LANGUAGES, languageId);
}
