import { findFunctionNames } from "./engine";

/** Derive a suggested title from code: first function name, else first non-empty line. */
export function deriveTitle(code: string): string {
  const names = findFunctionNames(code);
  if (names.length > 0) return `${names[0]}()`;
  const firstLine = code.split("\n").find((l) => l.trim().length > 0);
  return (firstLine?.trim() ?? "Untitled").slice(0, 60);
}
