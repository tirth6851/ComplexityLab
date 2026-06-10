import type { ReactNode } from "react";
import { ScanLine, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictReadout } from "@/components/ui/verdict-readout";
import { MetricGauge } from "@/components/ui/metric-gauge";
import { ComplexityTimeline } from "./complexity-timeline";
import type { CodeAnalysis } from "@/lib/ai/types";

export type AnalyzerStatus = "idle" | "analyzing" | "done" | "error";

export interface ResultsPanelProps {
  status: AnalyzerStatus;
  analysis: CodeAnalysis | null;
  error?: string | null;
  /** Action buttons rendered with a finished result (e.g. save controls). */
  actions?: ReactNode;
}

/** Pre-analysis placeholder. */
function IdleState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-ds-md border border-dashed border-line bg-grid-dots p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-ds-md border border-line bg-surface-panel text-primary">
        <ScanLine className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink-primary">Ready to analyze</p>
      <p className="max-w-xs text-xs text-ink-muted">
        Paste code or load a sample, then run the analyzer to see its time and
        space complexity broken down on the gradient.
      </p>
    </div>
  );
}

/** Skeleton readouts while the engine runs. */
function AnalyzingState() {
  return (
    <div className="space-y-4" aria-busy>
      <p className="cx-label animate-pulse">Scanning structure…</p>
      <Skeleton className="h-[58px] w-full" />
      <Skeleton className="h-[58px] w-full" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[88px]" />
        ))}
      </div>
      <Skeleton className="h-[260px] w-full" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-ds-md border border-dashed border-destructive/40 bg-[var(--danger-bg)] p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-ds-md border border-destructive/40 text-destructive">
        <TriangleAlert className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink-primary">Analysis failed</p>
      <p className="max-w-xs text-xs text-ink-muted">{message}</p>
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
  return (
    <div className="space-y-4">
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

      <p className="text-sm text-ink-secondary">{analysis.verdict}</p>

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
        <div className="rounded-ds-md border border-line-subtle bg-surface-panel p-4">
          <p className="cx-label mb-2.5">What the engine saw</p>
          <ul className="space-y-1.5">
            {analysis.notes.map((note) => (
              <li
                key={note}
                className="flex gap-2 text-xs leading-relaxed text-ink-secondary"
              >
                <span className="select-none text-primary" aria-hidden>
                  ▸
                </span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-3">
        <span className="font-mono text-2xs uppercase tracking-label text-ink-faint">
          {analysis.provider === "mock"
            ? "Heuristic engine"
            : `Provider: ${analysis.provider}`}{" "}
          · confidence {Math.round(analysis.confidence * 100)}%
        </span>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Right-hand analyzer panel: idle / scanning / verdict / error. */
export function ResultsPanel({
  status,
  analysis,
  error,
  actions,
}: ResultsPanelProps) {
  return (
    <Card className="p-4 sm:p-5" glow={status === "done"}>
      {status === "idle" && <IdleState />}
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
