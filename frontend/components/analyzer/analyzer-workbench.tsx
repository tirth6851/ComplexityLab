"use client";

import * as React from "react";
import { FileCode2, ScanLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CodeEditor } from "./code-editor";
import { IntroStrip } from "./intro-strip";
import { ResultsPanel, type AnalyzerStatus } from "./results-panel";
import { SaveActions } from "./save-actions";
import { LANGUAGES, type LanguageId } from "@/lib/analysis/languages";
import { SAMPLES } from "@/lib/analysis/samples";
import { takeAnalyzerHandoff } from "@/lib/analyzer-handoff";
import type { CodeAnalysis } from "@/lib/ai/types";

/** Min visible "scan" time so results don't flash in jarringly. */
const MIN_SCAN_MS = 650;

export interface AnalyzerWorkbenchProps {
  /** Buffer starts on this language's first sample (user's profile preference). */
  initialLanguage?: LanguageId;
}

export function AnalyzerWorkbench({
  initialLanguage = "typescript",
}: AnalyzerWorkbenchProps) {
  const [language, setLanguage] = React.useState<LanguageId>(initialLanguage);
  const [sampleId, setSampleId] = React.useState<string>(
    SAMPLES[initialLanguage][0].id,
  );
  const [code, setCode] = React.useState<string>(
    SAMPLES[initialLanguage][0].code,
  );
  const [status, setStatus] = React.useState<AnalyzerStatus>("idle");
  const [analysis, setAnalysis] = React.useState<CodeAnalysis | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  /** Bumped per result so SaveActions remounts with fresh state. */
  const [resultVersion, setResultVersion] = React.useState(0);
  /** Snapshot of the buffer the current result was computed from. */
  const [analyzed, setAnalyzed] = React.useState<{
    code: string;
    language: LanguageId;
  } | null>(null);

  // A pending "open in analyzer" handoff (from a saved analysis or snippet)
  // replaces the default sample buffer once, on mount. SSR can't read
  // sessionStorage, so this must be a one-shot post-hydration update — an
  // intentional external-store read, not a render-cascading sync.
  /* eslint-disable react-hooks/set-state-in-effect -- one-shot sessionStorage consume */
  React.useEffect(() => {
    const handoff = takeAnalyzerHandoff();
    if (!handoff) return;
    setLanguage(handoff.language);
    setSampleId("");
    setCode(handoff.code);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const monacoLanguage =
    LANGUAGES.find((l) => l.id === language)?.monaco ?? "plaintext";
  const samples = SAMPLES[language];

  function onLanguageChange(next: LanguageId) {
    setLanguage(next);
    // Switching language re-highlights the buffer; it never clobbers code.
    setSampleId("");
  }

  function onSampleChange(id: string) {
    setSampleId(id);
    const sample = samples.find((s) => s.id === id);
    if (sample) setCode(sample.code);
  }

  const abortRef = React.useRef<AbortController | null>(null);

  // Cancel any in-flight request when the component unmounts.
  React.useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);
  async function onUploadFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setCode(text);
    setSampleId("");
  }

  async function analyze() {
    if (status === "analyzing") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("analyzing");
    setError(null);
    try {
      const [res] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language }),
        }),
        new Promise((resolve) => setTimeout(resolve, MIN_SCAN_MS)),
      ]);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Analysis failed (HTTP ${res.status}).`);
      }
      const body = (await res.json()) as { analysis: CodeAnalysis };
      setAnalyzed({ code, language });
      setAnalysis(body.analysis);
      setResultVersion((v) => v + 1);
      setStatus("done");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Analysis failed.");
      setStatus("error");
    }
  }

  const empty = code.trim().length === 0;

  /** Single entry point for every analyze trigger (button, shortcut, idle CTA). */
  function requestAnalyze() {
    if (empty || status === "analyzing") return;
    void analyze();
  }

  // Ctrl/⌘+Enter anywhere on the page (Monaco registers its own command —
  // see CodeEditor — because it swallows window-level keydowns when focused).
  const analyzeRef = React.useRef(requestAnalyze);
  React.useEffect(() => {
    analyzeRef.current = requestAnalyze;
  });
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        analyzeRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <IntroStrip />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        {/* ---- input side ---- */}
        <Card className="overflow-hidden border-line bg-card/90">
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-panel/60 p-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="hidden size-10 shrink-0 items-center justify-center rounded-ds-md border border-line bg-card text-primary sm:flex">
                <FileCode2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-label text-primary">
                  Source editor
                </p>
                <p className="truncate text-xs text-ink-muted">
                  Paste code, load a sample, or upload a source file.
                </p>
              </div>
            </div>
            <div className="w-36">
              <Select
                label="Language"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-52 max-w-full flex-1 sm:flex-none">
              <Select
                label="Sample"
                value={sampleId}
                onChange={(e) => onSampleChange(e.target.value)}
              >
                <option value="" disabled>
                  Load a sample…
                </option>
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {empty && (
                <span className="text-xs text-ink-faint" aria-live="polite">
                  Paste code to analyze
                </span>
              )}
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-ds-md border border-line bg-card/40 px-3 text-xs font-medium text-ink-primary transition-all hover:border-primary/35 hover:bg-surface-raised">
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload
              <input
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.cpp,.cc,.c,.cs,.php,.rb,.txt"
                className="sr-only"
                onChange={(event) => {
                  void onUploadFile(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div>
              <Button
                onClick={requestAnalyze}
                disabled={empty || status === "analyzing"}
              >
                <ScanLine className="h-4 w-4" aria-hidden />
                {status === "analyzing" ? "Analyzing…" : "Analyze"}
              </Button>
            </div>
          </div>
          </div>

          <div className="relative bg-[#050816]">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={monacoLanguage}
              // Full 460px on desktop; on small viewports cap to ~half the
              // screen so the Analyze button and results stay reachable.
              height="clamp(300px, 55dvh, 460px)"
              onRun={requestAnalyze}
            />
            {status === "analyzing" && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
              >
                <div className="animate-sweep inset-x-0 h-16 bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line-subtle bg-surface-panel/40 px-4 py-2">
            <span className="font-mono text-2xs uppercase tracking-label text-ink-faint">
              {code.length.toLocaleString()} chars
              <span className="hidden sm:inline" aria-hidden>
                {" "}
                · ctrl/⌘ ↩ to analyze
              </span>
            </span>
            <span className="font-mono text-2xs uppercase tracking-label text-ink-faint">
              analyzed server-side · code never logged
            </span>
          </div>
        </Card>

        {/* ---- results side ---- */}
        <ResultsPanel
          status={status}
          analysis={analysis}
          error={error}
          idleAction={
            <Button
              variant="outline"
              size="sm"
              onClick={requestAnalyze}
              disabled={empty}
            >
              <ScanLine className="h-3.5 w-3.5" aria-hidden />
              Run first analysis
            </Button>
          }
          actions={
            analysis && analyzed ? (
              <SaveActions
                key={resultVersion}
                analysis={analysis}
                code={analyzed.code}
                language={analyzed.language}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
