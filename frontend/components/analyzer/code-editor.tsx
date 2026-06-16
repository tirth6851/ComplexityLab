"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Monaco } from "@monaco-editor/react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Monaco is browser-only; load it client-side with a skeleton fallback so the
 * analyzer route stays SSR-friendly.
 */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

function EditorSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-surface-inset p-4">
      {[80, 60, 72, 40, 64, 52, 68, 36].map((w, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/**
 * Editor color themes. Monaco requires concrete hex values, so these mirror
 * the Dark Lab palette in `app/tokens.css` / `globals.css` (the one sanctioned
 * exception to "no hardcoded colors" — keep in sync when tokens change).
 */
function defineThemes(monaco: Monaco) {
  monaco.editor.defineTheme("complexitylab-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "3a4a5c", fontStyle: "italic" },
      { token: "keyword", foreground: "a88bff" },
      { token: "string", foreground: "35f5b1" },
      { token: "number", foreground: "7df3c2" },
      { token: "type", foreground: "2bb8e0" },
      { token: "identifier", foreground: "edf2fc" },
    ],
    colors: {
      "editor.background": "#050816",
      "editor.foreground": "#ffffff",
      "editor.lineHighlightBackground": "#0b1220",
      "editorLineNumber.foreground": "#475569",
      "editorLineNumber.activeForeground": "#94a3b8",
      "editorCursor.foreground": "#00e599",
      "editor.selectionBackground": "#172338",
      "editorIndentGuide.background1": "#1e293b",
      "editorWidget.background": "#0b1220",
    },
  });
  monaco.editor.defineTheme("complexitylab-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "97a3b4", fontStyle: "italic" },
      { token: "keyword", foreground: "7c5cff" },
      { token: "string", foreground: "0e8453" },
      { token: "number", foreground: "15b873" },
      { token: "type", foreground: "0d7ea8" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#0e1726",
      "editor.lineHighlightBackground": "#f1f4f9",
      "editorLineNumber.foreground": "#bcc6d4",
      "editorCursor.foreground": "#0e8453",
    },
  });
}

/** Tracks the `.dark` class on <html> so the editor follows the theme toggle. */
function useIsDark() {
  const [dark, setDark] = React.useState(true);
  React.useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Monaco language id (from `lib/analysis/languages.ts`). */
  language: string;
  height?: number | string;
  /** Invoked on Ctrl/⌘+Enter inside the editor (Monaco swallows window keys). */
  onRun?: () => void;
}

export function CodeEditor({
  value,
  onChange,
  language,
  height = 440,
  onRun,
}: CodeEditorProps) {
  const dark = useIsDark();
  // Latest-callback ref: the Monaco command is registered once at mount.
  const onRunRef = React.useRef(onRun);
  React.useEffect(() => {
    onRunRef.current = onRun;
  });

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      onChange={(next) => onChange(next ?? "")}
      beforeMount={defineThemes}
      onMount={(editor, monaco) => {
        // Use the app's real mono font (next/font registers a custom family).
        const mono = getComputedStyle(document.documentElement)
          .getPropertyValue("--font-mono")
          .trim();
        if (mono) editor.updateOptions({ fontFamily: mono });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
          onRunRef.current?.(),
        );
      }}
      theme={dark ? "complexitylab-dark" : "complexitylab-light"}
      options={{
        fontSize: 13,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: "line",
        padding: { top: 14, bottom: 14 },
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        overviewRulerLanes: 0,
        contextmenu: false,
      }}
    />
  );
}
