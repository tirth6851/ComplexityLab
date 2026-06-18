"use client";

import * as React from "react";
import ReactDOM from "react-dom";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Element to focus on open; receives .select() if it is an input. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  description?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  initialFocusRef,
  description,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descId = React.useId();
  const returnFocusTo = React.useRef<HTMLElement | null>(null);

  // Capture trigger on open; return focus on close
  React.useEffect(() => {
    if (open) {
      returnFocusTo.current = document.activeElement as HTMLElement;
    } else {
      returnFocusTo.current?.focus();
    }
  }, [open]);

  // Focus the intended element once the dialog is open
  React.useEffect(() => {
    if (!open) return;
    const target = initialFocusRef?.current;
    if (target) {
      target.focus();
      if (typeof (target as HTMLInputElement).select === "function") {
        (target as HTMLInputElement).select();
      }
    } else {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }
  }, [open, initialFocusRef]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (typeof document === "undefined" || !open) return null;

  return ReactDOM.createPortal(
    <div
      data-testid="dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop — closes dialog on click, hidden from AT */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative z-10 w-full max-w-md rounded-ds-lg bg-background p-6 shadow-ds-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            className="ml-4 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            onClick={onClose}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {description && (
          <p id={descId} className="sr-only">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
