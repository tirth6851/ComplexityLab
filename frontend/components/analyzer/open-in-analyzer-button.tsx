"use client";

import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { setAnalyzerHandoff } from "@/lib/analyzer-handoff";
import { isLanguageId } from "@/lib/analysis/languages";

export interface OpenInAnalyzerButtonProps {
  code: string;
  /** Stored language id; falls back to typescript if it's no longer valid. */
  language: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

/** Sends a stored buffer back into the analyzer (sessionStorage handoff). */
export function OpenInAnalyzerButton({
  code,
  language,
  label = "Open in analyzer",
  variant = "outline",
  size = "sm",
}: OpenInAnalyzerButtonProps) {
  const router = useRouter();

  function open() {
    setAnalyzerHandoff({
      code,
      language: isLanguageId(language) ? language : "typescript",
    });
    router.push("/analyzer");
  }

  return (
    <Button variant={variant} size={size} onClick={open}>
      <ScanLine className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Button>
  );
}
