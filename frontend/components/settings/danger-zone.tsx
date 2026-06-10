"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAllDataAction } from "@/app/(app)/settings/actions";

type State = "idle" | "armed" | "deleting" | "done" | "error";

/**
 * Two-step "wipe my lab data" control. Deletes the profile row (analyses and
 * snippets cascade); a fresh profile is created on the next visit.
 */
export function DangerZone() {
  const [state, setState] = React.useState<State>("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state !== "armed") return;
    const timer = setTimeout(() => setState("idle"), 4000);
    return () => clearTimeout(timer);
  }, [state]);

  async function onClick() {
    if (state === "idle") {
      setState("armed");
      return;
    }
    if (state !== "armed") return;
    setState("deleting");
    setError(null);
    const res = await deleteAllDataAction();
    if (res.ok) {
      setState("done");
    } else {
      setState("error");
      setError(res.error ?? "Could not delete your data.");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={onClick}
        disabled={state === "deleting" || state === "done"}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {state === "armed"
          ? "Click again to confirm"
          : state === "deleting"
            ? "Deleting…"
            : state === "done"
              ? "Data deleted"
              : "Delete all lab data"}
      </Button>
      <p className="text-xs text-ink-faint">
        Permanently removes every analysis, snippet, and your profile row.
        Your sign-in itself is managed by Google and is not affected.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
