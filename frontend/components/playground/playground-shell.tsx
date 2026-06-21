"use client";

import * as React from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Play,
  Terminal,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CodeEditor } from "@/components/analyzer/code-editor";
import { JUDGE0_LANGUAGES } from "@/lib/execute/languages";
import type { ExecutionResult, ExecutionStatus } from "@/lib/execute/types";

type RunState = "idle" | "running" | "done" | "error";

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  go: "Go",
  rust: "Rust",
  cpp: "C++",
};

const DEFAULT_CODE: Record<string, string> = {
  python: `def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
`,
  javascript: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`,
  typescript: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
  rust: `fn main() {
    println!("Hello, World!");
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
};

const STATUS_CONFIG: Record<
  ExecutionStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  accepted: {
    label: "Accepted",
    icon: CheckCircle,
    className: "text-ok border-ok/30 bg-[var(--ok-bg)]",
  },
  compile_error: {
    label: "Compilation Error",
    icon: XCircle,
    className: "text-danger border-danger/30 bg-[var(--danger-bg)]",
  },
  runtime_error: {
    label: "Runtime Error",
    icon: XCircle,
    className: "text-danger border-danger/30 bg-[var(--danger-bg)]",
  },
  time_limit: {
    label: "Time Limit Exceeded",
    icon: TriangleAlert,
    className: "text-warn border-warn/30 bg-[var(--warn-bg)]",
  },
  error: {
    label: "Execution Error",
    icon: XCircle,
    className: "text-danger border-danger/30 bg-[var(--danger-bg)]",
  },
};

function OutputBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-2xs uppercase tracking-label text-ink-muted">
        {label}
      </p>
      <pre className="overflow-x-auto rounded-ds-md border border-line-subtle bg-surface-inset p-3 font-mono text-xs leading-relaxed text-ink-primary">
        {content}
      </pre>
    </div>
  );
}

function IdlePanel() {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-ds-xl border border-line-subtle bg-surface-panel/60 text-ink-faint">
        <Terminal className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium text-ink-secondary">
          No output yet
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Press Run or Ctrl/⌘ + Enter to execute
        </p>
      </div>
    </div>
  );
}

function RunningPanel() {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-ds-xl border border-primary/30 bg-primary/10 text-primary"
        aria-hidden
      >
        <Play className="h-5 w-5 animate-pulse" />
      </span>
      <p className="text-sm text-ink-secondary" aria-live="polite" aria-atomic>
        Running…
      </p>
    </div>
  );
}

function ResultPanel({ result }: { result: ExecutionResult }) {
  const config = STATUS_CONFIG[result.status];
  const Icon = config.icon;
  const hasStdout = !!result.stdout?.trim();
  const hasStderr = !!result.stderr?.trim();
  const hasCompile = !!result.compileOutput?.trim();

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-2 rounded-ds-md border px-3 py-2 text-sm font-medium ${config.className}`}
        role="status"
        aria-live="polite"
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {config.label}
        {(result.timeMs !== null || result.memoryKb !== null) && (
          <span className="ml-auto flex items-center gap-3 font-mono text-xs font-normal text-ink-muted">
            {result.timeMs !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                {result.timeMs}ms
              </span>
            )}
            {result.memoryKb !== null && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" aria-hidden />
                {Math.round(result.memoryKb / 1024 * 10) / 10}MB
              </span>
            )}
          </span>
        )}
      </div>

      {hasStdout && (
        <OutputBlock label="Output" content={result.stdout!} />
      )}
      {hasCompile && (
        <OutputBlock label="Compiler output" content={result.compileOutput!} />
      )}
      {hasStderr && (
        <OutputBlock label="stderr" content={result.stderr!} />
      )}
      {!hasStdout && !hasStderr && !hasCompile && result.status === "accepted" && (
        <p className="text-sm text-ink-muted">
          Program exited with no output.
        </p>
      )}
    </div>
  );
}

export function PlaygroundShell() {
  const [language, setLanguage] = React.useState("python");
  const [code, setCode] = React.useState(DEFAULT_CODE.python);
  const [stdin, setStdin] = React.useState("");
  const [stdinOpen, setStdinOpen] = React.useState(false);
  const [runState, setRunState] = React.useState<RunState>("idle");
  const [result, setResult] = React.useState<ExecutionResult | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  function onLanguageChange(next: string) {
    setLanguage(next);
    setCode(DEFAULT_CODE[next] ?? "");
    setResult(null);
    setFetchError(null);
    setRunState("idle");
  }

  async function run() {
    if (runState === "running" || !code.trim()) return;
    setRunState("running");
    setResult(null);
    setFetchError(null);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          stdin: stdin || undefined,
        }),
      });

      if (res.status === 401) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setFetchError(body?.error ?? "Sign in to run code.");
        setRunState("error");
        return;
      }
      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setFetchError(
          body?.error ?? "Rate limit reached — try again in a moment.",
        );
        setRunState("error");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setFetchError(body?.error ?? `Execution failed (HTTP ${res.status}).`);
        setRunState("error");
        return;
      }

      const body = (await res.json()) as { result: ExecutionResult };
      setResult(body.result);
      setRunState("done");
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "Network error. Please try again.",
      );
      setRunState("error");
    }
  }

  const requestRun = () => {
    void run();
  };

  const runRef = React.useRef(requestRun);
  React.useEffect(() => {
    runRef.current = requestRun;
  });
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const empty = code.trim().length === 0;
  const isRunning = runState === "running";

  return (
    <div className="mx-auto max-w-[1400px]">
      <section className="overflow-hidden rounded-ds-xl border border-line-subtle bg-gradient-to-br from-card via-card to-surface-panel/70 shadow-ds-xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-line-subtle bg-surface-panel/45 p-4 sm:p-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary shadow-glow-green-soft sm:flex">
              <Terminal className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-label text-primary">
                Code playground
              </p>
              <p className="truncate text-sm text-ink-secondary">
                Write and run code in your browser.
              </p>
            </div>
          </div>
          <div className="w-40">
            <Select
              label="Language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {Object.keys(JUDGE0_LANGUAGES).map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang] ?? lang}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid items-start xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
          <div className="border-line-subtle xl:border-r">
            <div className="relative bg-[#050816] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language === "cpp" ? "cpp" : language}
                height="clamp(360px, 62dvh, 620px)"
                onRun={requestRun}
              />
            </div>

            <div className="border-t border-line-subtle bg-surface-panel/45">
              <button
                type="button"
                onClick={() => setStdinOpen((o) => !o)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-ink-muted hover:text-ink-secondary"
                aria-expanded={stdinOpen}
              >
                {stdinOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="font-mono uppercase tracking-label">
                  stdin
                </span>
                {stdin && !stdinOpen && (
                  <span className="ml-1 rounded bg-surface-panel px-1 py-0.5 font-mono text-[10px] text-primary">
                    {stdin.split("\n").length} line
                    {stdin.split("\n").length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
              {stdinOpen && (
                <div className="border-t border-line-subtle px-4 pb-3 pt-2">
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter program input (one value per line)…"
                    rows={4}
                    className="w-full resize-none rounded-ds-md border border-line-subtle bg-surface-inset px-3 py-2 font-mono text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary/40"
                    aria-label="Standard input"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line-subtle bg-surface-panel/45 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 font-mono text-2xs uppercase tracking-label text-ink-faint">
                <span>{code.length.toLocaleString()} chars</span>
                <span aria-hidden>/</span>
                <span>Ctrl/⌘ Enter to run</span>
                <span aria-hidden>/</span>
                <span>code never stored</span>
              </div>
              <Button
                onClick={requestRun}
                disabled={empty || isRunning}
              >
                <Play className="h-4 w-4" aria-hidden />
                {isRunning ? "Running…" : "Run"}
              </Button>
            </div>
          </div>

          <div className="bg-background/35 p-4 sm:p-5">
            <p className="mb-4 font-mono text-xs uppercase tracking-label text-ink-muted">
              Output
            </p>

            {runState === "idle" && <IdlePanel />}
            {runState === "running" && <RunningPanel />}
            {runState === "error" && fetchError && (
              <div
                className="flex items-start gap-2.5 rounded-ds-md border border-danger/30 bg-[var(--danger-bg)] px-4 py-3 text-sm text-danger"
                role="alert"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{fetchError}</span>
              </div>
            )}
            {(runState === "done" || (runState === "error" && result)) &&
              result && <ResultPanel result={result} />}
          </div>
        </div>
      </section>
    </div>
  );
}
