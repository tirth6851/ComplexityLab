"use client";

import * as React from "react";
import { Check, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tiny toast system — context + fixed stack, no portal, no dependency.
 * Mounted once in the (app) layout; fire with `useToast().toast(...)`.
 */

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4500;
/** Never stack more than this many at once. */
const MAX_TOASTS = 3;

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}

/**
 * Provider-optional variant for shared primitives that may render outside the
 * app shell (and in component tests): degrades to a no-op without a provider.
 */
export function useToastSafe(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  return ctx ?? { toast: () => {} };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(1);
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    (message, opts) => {
      const id = nextId.current++;
      setToasts((current) => [
        ...current.slice(-(MAX_TOASTS - 1)),
        { id, message, variant: opts?.variant ?? "success" },
      ]);
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timers.current.add(timer);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* z matches --z-toast (500). */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[500] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-ds-md border bg-card px-3.5 py-2.5 shadow-ds-lg",
              t.variant === "error" ? "border-destructive/40" : "border-line",
            )}
          >
            {t.variant === "error" ? (
              <TriangleAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden
              />
            ) : (
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden
              />
            )}
            <p className="flex-1 text-sm text-ink-primary">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-ds-sm text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
