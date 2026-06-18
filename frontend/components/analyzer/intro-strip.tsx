"use client";

import * as React from "react";
import { BookOpen, Save, ScanLine, X } from "lucide-react";
import { Card } from "@/components/ui/card";

const STORAGE_KEY = "cl-analyzer-intro";
/** Bump to re-show the guide after the analyzer flow materially changes. */
const VERSION = "v1";

const STEPS = [
  {
    icon: BookOpen,
    title: "Load a sample",
    body: "Pick one of 18 templates across 7 languages — or paste your own code.",
  },
  {
    icon: ScanLine,
    title: "Analyze",
    body: "Hit Analyze (or Ctrl/⌘ + Enter) to see time & space complexity with reasoning.",
  },
  {
    icon: Save,
    title: "Save it",
    body: "Keep analyses and snippets — they build your library, stats, and streak.",
  },
] as const;

/* Tiny external store over the dismissal flag (same pattern as the consent
   gate) — re-renders subscribers on dismiss without setState-in-effect. */
const listeners = new Set<() => void>();
/** In-memory fallback so dismissing still works when storage is unavailable. */
let sessionDismissed = false;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): boolean {
  if (sessionDismissed) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== VERSION;
  } catch {
    return true;
  }
}
/** Hidden during SSR/hydration; the client reveals it for first-run users. */
function getServerSnapshot(): boolean {
  return false;
}
function dismissIntro(): void {
  sessionDismissed = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, VERSION);
  } catch {
    // Private mode etc. — the in-memory flag still hides it for this visit.
  }
  for (const listener of listeners) listener();
}

/** Dismissible first-run guide for the analyzer. */
export function IntroStrip() {
  const visible = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!visible) return null;

  return (
    <Card
      role="region"
      aria-label="Getting started"
      className="relative overflow-hidden p-5 sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary/60"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="cx-label">Getting started</p>
        <button
          type="button"
          onClick={dismissIntro}
          aria-label="Dismiss getting started guide"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-ds-sm text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-ds-md border border-line-accent bg-surface-panel text-primary shadow-inset-well">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-primary">
                  <span className="mr-1.5 font-mono text-2xs text-ink-faint">
                    {i + 1}
                  </span>
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
