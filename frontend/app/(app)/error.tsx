"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Route-segment error boundary for the authenticated app shell. Keeps the
 * sidebar/topbar alive and renders a recoverable failure state in the content
 * area.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl pt-10">
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-ds-md border border-destructive/40 bg-[var(--danger-bg)] text-destructive">
          <TriangleAlert className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Something broke in the lab
          </h2>
          <p className="max-w-md text-sm text-ink-muted">
            An unexpected error interrupted this page.
            {error.digest && (
              <span className="mt-1 block font-mono text-xs text-ink-faint">
                ref: {error.digest}
              </span>
            )}
          </p>
        </div>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </Card>
    </div>
  );
}
