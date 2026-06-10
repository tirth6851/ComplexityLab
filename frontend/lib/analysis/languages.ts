/** Languages the analyzer accepts. `monaco` is the Monaco editor language id. */
export const LANGUAGES = [
  { id: "typescript", label: "TypeScript", monaco: "typescript" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "go", label: "Go", monaco: "go" },
  { id: "rust", label: "Rust", monaco: "rust" },
  { id: "cpp", label: "C++", monaco: "cpp" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export function isLanguageId(value: string): value is LanguageId {
  return LANGUAGES.some((l) => l.id === value);
}

export function languageLabel(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? id;
}
