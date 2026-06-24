"use client";

import { useState, type ReactNode } from "react";
import {
  BrainCircuit,
  Gauge,
  Lightbulb,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CleanMotionBackground } from "@/components/ui/clean-motion-background";
import { ProgressiveFluxLoader } from "@/components/ui/progressive-flux-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictReadout } from "@/components/ui/verdict-readout";
import { MetricGauge } from "@/components/ui/metric-gauge";
import { ComplexityTimeline } from "./complexity-timeline";
import type { CodeAnalysis } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export type AnalyzerStatus = "idle" | "analyzing" | "done" | "error";

export interface ResultsPanelProps {
  status: AnalyzerStatus;
  analysis: CodeAnalysis | null;
  error?: string | null;
  actions?: ReactNode;
  idleAction?: ReactNode;
  analysisProgress?: number;
}

const tabs = [
  { id: "time", label: "Time", fullLabel: "Time Complexity", icon: Gauge },
  { id: "space", label: "Space", fullLabel: "Space Complexity", icon: ShieldCheck },
  { id: "tips", label: "Tips", fullLabel: "Optimization Tips", icon: Lightbulb },
  { id: "quality", label: "Quality", fullLabel: "Code Quality", icon: BrainCircuit },
] as const;

type ResultTab = (typeof tabs)[number]["id"];

function IdleState({ action }: { action?: ReactNode }) {
  return (
    <div className="relative flex h-full min-h-[560px] flex-col items-center justify-center gap-4 overflow-hidden rounded-ds-xl border border-dashed border-line-subtle bg-grid-dots p-8 text-center shadow-inset-well">
      <div aria-hidden className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div aria-hidden className="absolute left-1/2 top-20 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <span className="relative flex size-16 items-center justify-center rounded-ds-lg border border-line-accent bg-surface-panel text-primary shadow-glow-green-soft">
        <ScanLine className="h-6 w-6" aria-hidden />
      </span>
      <div className="relative space-y-2">
        <p className="font-display text-xl font-semibold text-ink-primary">
          Ready to analyze
        </p>
        <p className="max-w-md text-sm leading-6 text-ink-secondary">
          Run the analyzer to generate complexity verdicts, confidence metrics,
          optimization notes, and save actions.
        </p>
      </div>
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  );
}

function AnalyzingState({ progress }: { progress: number }) {
  return (
    <div className="min-h-[560px] space-y-5" aria-busy>
      <div className="rounded-ds-xl border border-line-subtle bg-surface-panel/55 p-5 shadow-inset-well">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-label text-primary">
              AI analysis
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-secondary">
              Tracing loops, branches, recursion, and allocation patterns.
            </p>
          </div>
          <span className="rounded-pill border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-2xs uppercase tracking-label text-primary">
            AI pass
          </span>
        </div>
        <ProgressiveFluxLoader value={progress} label="Analysis progress" />
      </div>
      <Skeleton className="h-[84px] w-full" />
      <Skeleton className="h-[84px] w-full" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[112px]" />
        ))}
      </div>
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[560px] flex-col items-center justify-center gap-4 rounded-ds-xl border border-dashed border-destructive/40 bg-[var(--danger-bg)] p-8 text-center shadow-inset-well">
      <span className="flex size-14 items-center justify-center rounded-ds-lg border border-destructive/40 text-destructive">
        <TriangleAlert className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-display text-xl font-semibold text-ink-primary">Analysis failed</p>
      <p className="max-w-md text-sm leading-6 text-ink-secondary">{message}</p>
    </div>
  );
}

function TabPanel({
  active,
  analysis,
}: {
  active: ResultTab;
  analysis: CodeAnalysis;
}) {
  if (active === "time") {
    return (
      <div className="trace-rail rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-5 shadow-inset-well">
        <p className="cx-label mb-2">Reasoning</p>
        <p className="text-base leading-7 text-ink-secondary">
          {analysis.time.reason}
        </p>
      </div>
    );
  }

  if (active === "space") {
    return (
      <div className="space-y-4">
        <div className="trace-rail rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-5 shadow-inset-well">
          <p className="cx-label mb-2">Memory behavior</p>
          <p className="text-base leading-7 text-ink-secondary">
            {analysis.space.reason}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {analysis.metrics.map((m) => (
            <MetricGauge
              key={m.id}
              label={m.label}
              value={m.value}
              fraction={m.fraction}
              tier={m.tier}
              hint={m.hint}
            />
          ))}
        </div>
      </div>
    );
  }

  if (active === "tips") {
    return (
      <div className="trace-rail rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-5 shadow-inset-well">
        <p className="cx-label mb-3">Optimization clues</p>
        <ul className="space-y-3">
          {analysis.notes.length > 0 ? (
            analysis.notes.map((note) => (
              <li key={note} className="flex gap-3 text-sm leading-6 text-ink-secondary">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {note}
              </li>
            ))
          ) : (
            <li className="text-sm text-ink-muted">
              No extra optimization notes were returned for this analysis.
            </li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="trace-rail rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-5 shadow-inset-well">
        <p className="cx-label mb-2">AI verdict</p>
        <p className="text-sm leading-6 text-ink-secondary">{analysis.verdict}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-4 shadow-inset-well">
          <p className="text-xs text-ink-muted">Provider</p>
          <p className="mt-2 font-mono text-sm text-ink-primary">
            {analysis.provider === "mock" ? "Heuristic engine" : analysis.provider}
          </p>
        </div>
        <div className="rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-4 shadow-inset-well">
          <p className="text-xs text-ink-muted">Confidence</p>
          <p className="mt-2 font-mono text-sm text-primary">
            {Math.round(analysis.confidence * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultState({
  analysis,
  actions,
}: {
  analysis: CodeAnalysis;
  actions?: ReactNode;
}) {
  const [active, setActive] = useState<ResultTab>("time");

  return (
    <div className="space-y-6">
      {analysis.syntaxError && (
        <div
          className="flex items-start gap-3 rounded-ds-md border border-destructive/50 bg-[var(--danger-bg)] px-4 py-3 text-destructive"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Syntax error detected</p>
            <p className="mt-0.5 text-sm opacity-80">{analysis.syntaxError}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-label text-primary">
            AI results
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-normal">
            Complexity breakdown
          </h2>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="rounded-ds-xl border border-line-subtle bg-surface-panel/35 p-3 shadow-inset-well">
        <div className="space-y-2">
          <VerdictReadout
            label="TIME"
            notation={analysis.time.notation}
            tier={analysis.time.tier}
          />
          <VerdictReadout
            label="SPACE"
            notation={analysis.space.notation}
            tier={analysis.space.tier}
          />
        </div>
      </div>

      <p className="rounded-ds-lg border border-line-subtle bg-surface-panel/45 p-4 text-base leading-7 text-ink-secondary shadow-inset-well">
        {analysis.verdict}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {analysis.metrics.map((m) => (
          <MetricGauge
            key={m.id}
            label={m.label}
            value={m.value}
            fraction={m.fraction}
            tier={m.tier}
            hint={m.hint}
          />
        ))}
      </div>

      <ComplexityTimeline highlight={analysis.time.notation} />

      {analysis.notes.length > 0 && (
        <div className="trace-rail rounded-ds-lg border border-line-subtle bg-surface-panel/60 p-5 shadow-inset-well">
          <p className="cx-label mb-2.5">What the engine saw</p>
          <ul className="space-y-1.5">
            {analysis.notes.map((note) => (
              <li
                key={note}
                className="flex gap-2 text-sm leading-6 text-ink-secondary"
              >
                <span className="select-none text-primary" aria-hidden>
                  ›
                </span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <CleanMotionBackground
        items={tabs.map((tab) => ({
          key: tab.id,
          label: tab.fullLabel,
          icon: tab.icon,
        }))}
        value={active}
        onChange={(key) => setActive(key as ResultTab)}
        mode="both"
        role="tablist"
        itemRole="tab"
        ariaLabel="Analysis result sections"
        layoutId="analysis-result-tab-highlight"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        itemClassName={(_, state) =>
          cn(
            "flex min-h-20 flex-col items-start justify-between rounded-ds-lg border p-3 text-left text-xs",
            state.active
              ? "border-primary/35 text-primary"
              : "border-line-subtle bg-surface-panel/50 text-ink-muted hover:border-line-strong hover:text-ink-primary",
          )
        }
        indicatorClassName="bg-gradient-to-br from-emerald-400/14 via-teal-300/12 to-cyan-300/14"
        getItemProps={(_, state) => ({ "aria-selected": state.active })}
        renderItem={(item) => {
          const tab = tabs.find((candidate) => candidate.id === item.key);
          const Icon = tab?.icon ?? Gauge;
          return (
            <>
              <Icon className="h-4 w-4" aria-hidden />
              <span className="font-medium sm:hidden">{tab?.label}</span>
              <span className="hidden font-medium sm:inline">{tab?.fullLabel}</span>
            </>
          );
        }}
      />

      <TabPanel active={active} analysis={analysis} />
    </div>
  );
}

export function ResultsPanel({
  status,
  analysis,
  error,
  actions,
  idleAction,
  analysisProgress = 0,
}: ResultsPanelProps) {
  const statusMessage =
    status === "analyzing"
      ? "Analyzing code…"
      : status === "done" && analysis
        ? `Analysis complete. Time ${analysis.time.notation}. Space ${analysis.space.notation}.`
        : "";
  const alertMessage =
    status === "error"
      ? `Analysis failed. ${error ?? "Something went wrong while analyzing."}`
      : "";

  const hasSyntaxError = status === "done" && !!analysis?.syntaxError;

  return (
    <Card
      className={cn(
        "min-h-[600px] p-4 sm:p-6",
        hasSyntaxError && "border-destructive/40 bg-[var(--danger-bg)]/20",
      )}
      glow={status === "done" && !hasSyntaxError}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
      <div role="alert" aria-atomic="true" className="sr-only">
        {alertMessage}
      </div>
      {status === "idle" && <IdleState action={idleAction} />}
      {status === "analyzing" && <AnalyzingState progress={analysisProgress} />}
      {status === "error" && (
        <ErrorState message={error ?? "Something went wrong while analyzing."} />
      )}
      {status === "done" && analysis && (
        <ResultState analysis={analysis} actions={actions} />
      )}
    </Card>
  );
}
