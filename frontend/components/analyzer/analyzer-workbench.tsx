"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BotMessageSquare, FileCode2, LockKeyhole, Play, ScanLine, Upload, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CodeEditor } from "./code-editor";
import { IntroStrip } from "./intro-strip";
import { ResultsPanel, type AnalyzerStatus } from "./results-panel";
import { SaveActions } from "./save-actions";
import {
  ActivityToast,
  type ActivityToastItem,
} from "@/components/ui/activity-toast";
import { LANGUAGES, languageLabel, type LanguageId } from "@/lib/analysis/languages";
import { SAMPLES } from "@/lib/analysis/samples";
import { takeAnalyzerHandoff } from "@/lib/analyzer-handoff";
import { setChatHandoff } from "@/lib/chat-handoff";
import { setPlaygroundHandoff } from "@/lib/playground-handoff";
import { isExecutable } from "@/lib/execute/languages";
import type { CodeAnalysis } from "@/lib/ai/types";

const MIN_SCAN_MS = 650;

export interface AnalyzerWorkbenchProps {
  initialLanguage?: LanguageId;
}

export function AnalyzerWorkbench({
  initialLanguage = "typescript",
}: AnalyzerWorkbenchProps) {
  const router = useRouter();
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
  const [resultVersion, setResultVersion] = React.useState(0);
  const [analyzed, setAnalyzed] = React.useState<{
    code: string;
    language: LanguageId;
  } | null>(null);
  const [activities, setActivities] = React.useState<ActivityToastItem[]>([]);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);

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
  const empty = code.trim().length === 0;

  function onLanguageChange(next: LanguageId) {
    setLanguage(next);
    // Keep current sample selection if it was custom; otherwise reset to first sample of new language
    if (sampleId !== "__custom__") {
      setSampleId("");
    }
  }

  function onSampleChange(id: string) {
    setSampleId(id);
    if (id === "__custom__") {
      setCode("");
      return;
    }
    const sample = samples.find((s) => s.id === id);
    if (sample) setCode(sample.code);
  }

  const abortRef = React.useRef<AbortController | null>(null);
  const progressTimersRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearAnalysisProgressTimers();
    };
  }, []);

  function clearAnalysisProgressTimers() {
    progressTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    progressTimersRef.current = [];
  }

  function startAnalysisProgress() {
    clearAnalysisProgressTimers();
    setAnalysisProgress(0);
    const phases = [
      { delay: 120, value: 25 },
      { delay: 360, value: 55 },
      { delay: 620, value: 80 },
    ];
    progressTimersRef.current = phases.map(({ delay, value }) =>
      window.setTimeout(() => {
        setAnalysisProgress((current) => Math.max(current, value));
      }, delay),
    );
  }

  function dismissActivity(id: string) {
    setActivities((items) => items.filter((item) => item.id !== id));
  }

  function clearActivities() {
    setActivities([]);
  }

  function upsertActivity(item: ActivityToastItem) {
    setActivities((items) => {
      const existing = items.findIndex((candidate) => candidate.id === item.id);
      if (existing === -1) return [item, ...items].slice(0, 6);
      const next = [...items];
      next[existing] = item;
      return next;
    });
  }

  async function onUploadFile(file: File | null) {
    if (!file) return;

    const activityId = `upload-${Date.now()}-${file.name}`;
    upsertActivity({
      id: activityId,
      title: file.name,
      detail: "Reading file...",
      status: "PROCESSING",
      progressLabel: "Reading file...",
    });

    try {
      const text = await file.text();
      setCode(text);
      setSampleId("");
      upsertActivity({
        id: activityId,
        title: file.name,
        detail: "File loaded successfully",
        status: "SUCCESS",
        progressLabel: "File loaded successfully",
      });
    } catch {
      upsertActivity({
        id: activityId,
        title: file.name,
        detail: "File upload failed",
        status: "ERROR",
        progressLabel: "File upload failed",
      });
    }
  }

  async function analyze() {
    if (status === "analyzing") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    startAnalysisProgress();
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
      clearAnalysisProgressTimers();
      setAnalysisProgress(100);
      setResultVersion((v) => v + 1);
      setStatus("done");
    } catch (e) {
      clearAnalysisProgressTimers();
      if (e instanceof Error && e.name === "AbortError") return;
      setAnalysisProgress(0);
      setError(e instanceof Error ? e.message : "Analysis failed.");
      setStatus("error");
    }
  }

  function requestAnalyze() {
    if (empty || status === "analyzing") return;
    void analyze();
  }

  function openInPlayground() {
    if (!analyzed || !isExecutable(analyzed.language)) return;
    setPlaygroundHandoff({ code: analyzed.code, language: analyzed.language });
    router.push("/playground");
  }

  function chatWithAI() {
    if (!analyzed || !analysis) return;
    const notes = analysis.notes.length > 0
      ? analysis.notes.map((note) => `- ${note}`).join("\n")
      : "- No additional optimization notes or warnings were returned.";
    const syntaxLine = analysis.syntaxError
      ? `\nSyntax Error: ${analysis.syntaxError}\n`
      : "";
    const msg =
      `I just analyzed code in ComplexityLab. Please explain the result and suggest safe improvements.\n\n` +
      `Language: ${analyzed.language}\n` +
      `Time Complexity: ${analysis.time.notation} - ${analysis.time.reason}\n` +
      `Space Complexity: ${analysis.space.notation} - ${analysis.space.reason}\n` +
      `Verdict: ${analysis.verdict}\n` +
      `Confidence: ${Math.round(analysis.confidence * 100)}%\n` +
      syntaxLine +
      `\nOptimization notes / warnings:\n${notes}\n\n` +
      `Source code:\n` +
      `\`\`\`${analyzed.language}\n${analyzed.code}\n\`\`\``;
    setChatHandoff({ initialMessage: msg });
    router.push("/chat");
  }
  const playgroundSupported = analyzed ? isExecutable(analyzed.language) : true;
  const playgroundUnsupportedMessage = analyzed && !playgroundSupported
    ? `${languageLabel(analyzed.language)} is not supported in Playground yet.`
    : null;

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
    <div className="mx-auto w-full max-w-[1540px] min-w-0 space-y-6 sm:space-y-8">
      <IntroStrip />

      <section className="min-w-0 overflow-hidden rounded-ds-xl border border-line-subtle bg-gradient-to-br from-card via-card to-surface-panel/70 shadow-ds-xl">
        <div className="flex min-w-0 flex-col gap-5 border-b border-line-subtle bg-surface-panel/45 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl min-w-0">
            <p className="font-mono text-2xs uppercase tracking-label text-primary">
              Analyzer workspace
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
              Trace code paths, then lock in the Big-O reasoning.
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-secondary">
              Paste code, upload a source file, or start from a sample. The editor stays focused while the results panel explains complexity, confidence, and optimization clues.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-[420px]">
            {[
              [WandSparkles, "AI feedback"],
              [LockKeyhole, "Server-side"],
              [FileCode2, `${code.length.toLocaleString()} chars`],
            ].map(([Icon, label]) => (
              <div
                key={label as string}
                className="rounded-ds-lg border border-line-subtle bg-card/70 p-3 shadow-inset-well"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  {label as string}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 items-start gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
          <div className="min-w-0 border-line-subtle xl:border-r">
            <div className="flex min-w-0 flex-col gap-3 border-b border-line-subtle bg-card/50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="hidden size-10 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary shadow-glow-green-soft sm:flex">
                  <FileCode2 className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-label text-primary">
                    Source editor
                  </p>
                  <p className="truncate text-sm text-ink-secondary">
                    Choose a language, load a sample, or upload source.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-36">
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
              <div className="w-full max-w-full flex-1 sm:w-52 sm:flex-none">
                <Select
                  label="Sample"
                  value={sampleId}
                  onChange={(e) => onSampleChange(e.target.value)}
                >
                  <option value="" disabled>
                    Load a sample...
                  </option>
                  <option value="__custom__">âœï¸ Custom (blank)</option>
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="relative min-w-0 overflow-hidden bg-[#050816] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={monacoLanguage}
                height="clamp(360px, 62dvh, 620px)"
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

            <div className="flex min-w-0 flex-col gap-3 border-t border-line-subtle bg-surface-panel/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 font-mono text-2xs uppercase tracking-label text-ink-faint">
                <span>{code.length.toLocaleString()} chars</span>
                <span aria-hidden>/</span>
                <span>Ctrl/Cmd Enter to analyze</span>
                <span aria-hidden>/</span>
                <span>code never logged</span>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {empty && (
                  <span className="text-xs text-ink-faint" aria-live="polite">
                    {sampleId === "__custom__"
                      ? "Type or paste your code above"
                      : "Load a sample or paste code to analyze"}
                  </span>
                )}
                <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-ds-md border border-line-subtle bg-card/60 px-3 text-xs font-medium text-ink-primary shadow-ds-sm transition-all hover:border-primary/35 hover:bg-surface-raised sm:w-auto">
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
                <Button
                  className="w-full sm:w-auto"
                  onClick={requestAnalyze}
                  disabled={empty || status === "analyzing"}
                >
                  <ScanLine className="h-4 w-4" aria-hidden />
                  {status === "analyzing" ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>
          </div>

          <div className="min-w-0 bg-background/35 p-3 sm:p-5">
            <ResultsPanel
              status={status}
              analysis={analysis}
              error={error}
              analysisProgress={analysisProgress}
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
                  <>
                    <SaveActions
                      key={resultVersion}
                      analysis={analysis}
                      code={analyzed.code}
                      language={analyzed.language}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInPlayground}
                      disabled={!playgroundSupported}
                      title={playgroundUnsupportedMessage ?? undefined}
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden />
                      Open in Playground
                    </Button>
                    {playgroundUnsupportedMessage && (
                      <span className="basis-full text-xs text-destructive" role="status">
                        {playgroundUnsupportedMessage}
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={chatWithAI}>
                      <BotMessageSquare className="h-3.5 w-3.5" aria-hidden />
                      Chat with AI
                    </Button>
                  </>
                ) : undefined
              }
            />
          </div>
        </div>
      </section>

      <ActivityToast
        items={activities}
        onDismiss={dismissActivity}
        onClearAll={clearActivities}
      />
    </div>
  );
}
