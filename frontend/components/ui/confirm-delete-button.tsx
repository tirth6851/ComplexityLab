"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDeleteButtonProps {
  /** Server action (or async fn) executed on confirmation. */
  action: () => Promise<{ ok: boolean; error?: string }>;
  /** Accessible label, e.g. "Delete analysis quickSort()". */
  label: string;
  className?: string;
}

/**
 * Two-step destructive button: first click arms it ("Sure?"), second click
 * runs the action. Disarms on blur or after a short timeout — no modal needed.
 */
export function ConfirmDeleteButton({
  action,
  label,
  className,
}: ConfirmDeleteButtonProps) {
  const [armed, setArmed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onClick() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    startTransition(async () => {
      await action();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onBlur={() => setArmed(false)}
      disabled={pending}
      aria-label={armed ? `Confirm: ${label}` : label}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-ds-sm border px-2 font-mono text-2xs uppercase tracking-label transition-colors duration-[120ms] ease-ds focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-45",
        armed
          ? "border-destructive/50 bg-[var(--danger-bg)] text-destructive"
          : "border-transparent text-ink-faint hover:border-line hover:text-ink-secondary",
        className,
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {pending ? "…" : armed ? "Sure?" : null}
    </button>
  );
}
