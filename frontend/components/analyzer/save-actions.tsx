"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Check, ExternalLink, Save } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  saveAnalysisAction,
  saveSnippetAction,
} from "@/app/(app)/analyzer/actions";
import type { CodeAnalysis } from "@/lib/ai/types";
import type { LanguageId } from "@/lib/analysis/languages";

export interface SaveActionsProps {
  analysis: CodeAnalysis;
  code: string;
  language: LanguageId;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function useSave(action: () => Promise<{ ok: boolean; id?: string; error?: string }>) {
  const [state, setState] = React.useState<SaveState>("idle");
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    if (state === "saving" || state === "saved") return;
    setState("saving");
    setError(null);
    const res = await action();
    if (res.ok) {
      setState("saved");
      if (res.id) setSavedId(res.id);
    } else {
      setState("error");
      setError(res.error ?? "Save failed.");
    }
  }

  return { state, savedId, error, run };
}

/**
 * Result actions for a finished analysis: persist it to "Analyses" and/or
 * store the buffer as a saved snippet. Remounted per result (key) so the
 * saved state resets when a new analysis lands.
 */
export function SaveActions({ analysis, code, language }: SaveActionsProps) {
  const analysisSave = useSave(() =>
    saveAnalysisAction({ code, language, analysis }),
  );
  const snippetSave = useSave(() => saveSnippetAction({ code, language }));

  const firstError = analysisSave.error ?? snippetSave.error;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={analysisSave.run}
          disabled={analysisSave.state === "saving"}
        >
          {analysisSave.state === "saved" ? (
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
          ) : (
            <Save className="h-3.5 w-3.5" aria-hidden />
          )}
          {analysisSave.state === "saved"
            ? "Saved"
            : analysisSave.state === "saving"
              ? "Saving…"
              : "Save analysis"}
        </Button>
        {analysisSave.state === "saved" && analysisSave.savedId && (
          <Link
            href={`/analyses/${analysisSave.savedId}`}
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            View
          </Link>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={snippetSave.run}
          disabled={snippetSave.state === "saving"}
        >
          {snippetSave.state === "saved" ? (
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
          ) : (
            <Bookmark className="h-3.5 w-3.5" aria-hidden />
          )}
          {snippetSave.state === "saved"
            ? "Snippet saved"
            : snippetSave.state === "saving"
              ? "Saving…"
              : "Save snippet"}
        </Button>
        {snippetSave.state === "saved" && snippetSave.savedId && (
          <Link
            href="/snippets"
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            View
          </Link>
        )}
      </div>
      {firstError && (
        <span className="text-xs text-destructive">{firstError}</span>
      )}
    </div>
  );
}
