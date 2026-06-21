"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityToastStatus = "QUEUED" | "PROCESSING" | "SUCCESS" | "ERROR";

export interface ActivityToastItem {
  id: string;
  title: string;
  detail?: string;
  status: ActivityToastStatus;
  progressLabel?: string;
}

export interface ActivityToastProps {
  items: ActivityToastItem[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

const statusCopy: Record<ActivityToastStatus, string> = {
  QUEUED: "Queued",
  PROCESSING: "Processing file",
  SUCCESS: "File loaded",
  ERROR: "Action failed",
};

const statusStyles: Record<ActivityToastStatus, string> = {
  QUEUED: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  PROCESSING: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  SUCCESS: "border-emerald-300/35 bg-emerald-300/12 text-emerald-200",
  ERROR: "border-destructive/35 bg-destructive/10 text-red-200",
};

function StatusIcon({ status }: { status: ActivityToastStatus }) {
  if (status === "PROCESSING") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />;
  }
  if (status === "SUCCESS") {
    return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
  }
  if (status === "ERROR") {
    return <AlertCircle className="h-3.5 w-3.5" aria-hidden />;
  }
  return <Clock3 className="h-3.5 w-3.5" aria-hidden />;
}

export function ActivityToast({
  items,
  onDismiss,
  onClearAll,
  className,
}: ActivityToastProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (items.length === 0) return null;

  const activeCount = items.filter(
    (item) => item.status === "QUEUED" || item.status === "PROCESSING",
  ).length;

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Activity Center"
      className={cn(
        "fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[420px] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:mx-0 sm:w-[380px]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-ds-xl border border-line-subtle bg-card/95 text-card-foreground shadow-[0_24px_80px_-32px_rgba(0,0,0,0.95),0_0_40px_-28px_rgba(0,229,153,0.85)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-line-subtle bg-surface-panel/65 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-primary/10 text-primary shadow-glow-green-soft">
            {activeCount > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-sm font-semibold text-ink-primary">
              Activity Center
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              {activeCount > 0
                ? `${activeCount} active action${activeCount === 1 ? "" : "s"}`
                : `${items.length} recent action${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-ds-md text-ink-secondary transition hover:bg-surface-raised hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={collapsed ? "Expand activity center" : "Collapse activity center"}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex h-8 w-8 items-center justify-center rounded-ds-md text-ink-secondary transition hover:bg-surface-raised hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Clear all activity"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {!collapsed && (
          <ul className="max-h-[280px] divide-y divide-line-subtle overflow-y-auto">
            {items.map((item) => {
              const label = item.progressLabel ?? statusCopy[item.status];
              return (
                <li key={item.id} className="group px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-ds-md border",
                        statusStyles[item.status],
                      )}
                    >
                      <StatusIcon status={item.status} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-medium text-ink-primary">
                          {item.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => onDismiss(item.id)}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-ds-sm text-ink-faint opacity-100 transition hover:bg-surface-raised hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          aria-label={`Dismiss ${item.title}`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      {item.detail && (
                        <p className="line-clamp-2 text-xs leading-5 text-ink-secondary">
                          {item.detail}
                        </p>
                      )}
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                        <span>{label}</span>
                        {item.status === "PROCESSING" && (
                          <span
                            className="h-px flex-1 overflow-hidden rounded-full bg-surface-raised"
                            aria-hidden
                          >
                            <span className="block h-full w-1/2 animate-sweep bg-gradient-to-r from-transparent via-primary to-cyan-300" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
