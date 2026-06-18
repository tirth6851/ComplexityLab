"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Check, ExternalLink, Save } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { SaveDialog } from "@/components/analyzer/save-dialog";
import { useToastSafe } from "@/components/ui/toaster";
import {
  saveAnalysisAction,
  saveSnippetAction,
} from "@/app/(app)/analyzer/actions";
import { deriveTitle } from "@/lib/analysis/derive-title";
import type { CodeAnalysis } from "@/lib/ai/types";
import type { LanguageId } from "@/lib/analysis/languages";

export interface SaveActionsProps {
  analysis: CodeAnalysis;
  code: string;
  language: LanguageId;
}

/**
 * Result actions for a finished analysis: persist it to "Analyses" and/or
 * store the buffer as a saved snippet. Each button opens a SaveDialog that
 * requires a confirmed title before saving. Remounted per result (key) so
 * the saved state resets when a new analysis lands.
 */
export function SaveActions({ analysis, code, language }: SaveActionsProps) {
  const { toast } = useToastSafe();
  const [analysisDialogOpen, setAnalysisDialogOpen] = React.useState(false);
  const [snippetDialogOpen, setSnippetDialogOpen] = React.useState(false);
  const [analysisSavedId, setAnalysisSavedId] = React.useState<string | null>(null);
  const [snippetSaved, setSnippetSaved] = React.useState(false);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const defaultTitle = React.useMemo(() => deriveTitle(code), [code]);

  async function handleAnalysisSave(title: string) {
    const result = await saveAnalysisAction({ code, language, analysis, title });
    if (!mountedRef.current) return result;
    if (result.ok && result.id) {
      setAnalysisSavedId(result.id);
      toast("Analysis saved.", { variant: "success" });
    }
    return result;
  }

  async function handleSnippetSave(title: string, tags?: string[]) {
    const result = await saveSnippetAction({ code, language, title, tags });
    if (!mountedRef.current) return result;
    if (result.ok) {
      setSnippetSaved(true);
      toast("Snippet saved.", { variant: "success" });
    }
    return result;
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnalysisDialogOpen(true)}
            disabled={!!analysisSavedId}
          >
            {analysisSavedId ? (
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {analysisSavedId ? "Saved" : "Save analysis"}
          </Button>
          {analysisSavedId && (
            <Link
              href={`/analyses/${analysisSavedId}`}
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              View
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSnippetDialogOpen(true)}
            disabled={snippetSaved}
          >
            {snippetSaved ? (
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
            ) : (
              <Bookmark className="h-3.5 w-3.5" aria-hidden />
            )}
            {snippetSaved ? "Snippet saved" : "Save snippet"}
          </Button>
          {snippetSaved && (
            <Link
              href="/snippets"
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              View
            </Link>
          )}
        </div>
      </div>

      <SaveDialog
        key={analysisDialogOpen ? "analysis-open" : "analysis-closed"}
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        onSave={handleAnalysisSave}
        defaultTitle={defaultTitle}
        language={language}
        timeComplexity={analysis.time.notation}
        spaceComplexity={analysis.space.notation}
      />
      <SaveDialog
        key={snippetDialogOpen ? "snippet-open" : "snippet-closed"}
        open={snippetDialogOpen}
        onClose={() => setSnippetDialogOpen(false)}
        onSave={handleSnippetSave}
        defaultTitle={defaultTitle}
        showTags
        language={language}
      />
    </>
  );
}
