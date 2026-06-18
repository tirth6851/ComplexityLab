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
}

const tabs = [
  { id: "time", label: "Time Complexity", icon: Gauge },
  { id: "space", label: "Space Complexity", icon: ShieldCheck },
  { id: "tips", label: "Optimization Tips", icon: Lightbulb },
  { id: "quality", label: "Code Quality", icon: BrainCircuit },
] as const;

type ResultTab = (typeof tabs)[number]["id"];

function IdleState({ action }: { action?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-3 rounded-ds-xl border border-dashed border-line bg-grid-dots p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-ds-lg border border-line bg-surface-panel text-primary shadow-glow-green-soft">
        <ScanLine className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink-primary">Ready for AI analysis</p>
      <p className="max-w-sm text-xs leading-5 text-ink-muted">
        Run the analyzer to generate time complexity, space complexity,
        optimization notes, confidence, and save actions.
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function AnalyzingState() {
  return (
    <div className="min-h-[520px] space-y-4" aria-busy>
      <div className="flex items-center justify-between">
        <p className="cx-label animate-pulse text-primary">Scanning structure</p>
        <span className="rounded-pill border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-2xs uppercase tracking-label text-primary">
          AI pass
        </span>
      </div>
      <Skeleton className="h-[72px] w-full" />
      <Skeleton className="h-[72px] w-full" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[98px]" />
        ))}
      </div>
      <Skeleton className="h-[260px] w-full" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-3 rounded-ds-xl border border-dashed border-destructive/40 bg-[var(--danger-bg)] p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-ds-lg border border-destructive/40 text-destructive">
        <TriangleAlert className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink-primary">Analysis failed</p>
      <p className="max-w-sm text-xs leading-5 text-ink-muted">{message}</p>
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
      <div className="space-y-4">
        <VerdictReadout
          label="TIME"
          notation={analysis.time.notation}
          tier={analysis.time.tier}
        />
        <div className="rounded-ds-lg border border-line bg-surface-panel/60 p-4">
          <p className="cx-label mb-2">Reasoning</p>
          <p className="text-sm leading-6 text-ink-secondary">
            {analysis.time.reason}
          </p>
        </div>
        <ComplexityTimeline highlight={analysis.time.notation} />
      </div>
    );
  }

  if (active === "space") {
    return (
      <div className="space-y-4">
        <VerdictReadout
          label="SPACE"
          notation={analysis.space.notation}
          tier={analysis.space.tier}
        />
        <div className="rounded-ds-lg border border-line bg-surface-panel/60 p-4">
          <p className="cx-label mb-2">Memory behavior</p>
          <p className="text-sm leading-6 text-ink-secondary">
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
      <div className="rounded-ds-lg border border-line bg-surface-panel/60 p-4">
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
      <div className="rounded-ds-lg border border-line bg-surface-panel/60 p-4">
        <p className="cx-label mb-2">AI verdict</p>
        <p className="text-sm leading-6 text-ink-secondary">{analysis.verdict}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-ds-lg border border-line bg-surface-panel/60 p-4">
          <p className="text-xs text-ink-muted">Provider</p>
          <p className="mt-2 font-mono text-sm text-ink-primary">
            {analysis.provider === "mock" ? "Heuristic engine" : analysis.provider}
          </p>
        </div>
        <div className="rounded-ds-lg border border-line bg-surface-panel/60 p-4">
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-label text-primary">
            AI results
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Complexity breakdown
          </h2>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex min-h-16 flex-col items-start justify-between rounded-ds-lg border p-3 text-left text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-line bg-surface-panel/50 text-ink-muted hover:border-line-strong hover:text-ink-primary",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

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
}: ResultsPanelProps) {
  return (
    <Card className="min-h-[560px] p-4 sm:p-5" glow={status === "done"}>
      {/* Screen-reader live regions — always present in the DOM */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status === "analyzing" && "Analyzing code…"}
        {status === "done" && analysis &&
          `Analysis complete. ${analysis.time.notation} time. ${analysis.space.notation} space.`}
      </div>
      <div role="alert" aria-atomic="true" className="sr-only">
        {status === "error" &&
          `Analysis failed. ${error ?? "Something went wrong while analyzing."}`}
      </div>

      {status === "idle" && <IdleState action={idleAction} />}
      {status === "analyzing" && <AnalyzingState />}
      {status === "error" && (
        <ErrorState message={error ?? "Something went wrong while analyzing."} />
      )}
      {status === "done" && analysis && (
        <ResultState analysis={analysis} actions={actions} />
      )}
    </Card>
  );
}
