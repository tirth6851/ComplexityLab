import type { Metadata } from "next";
import { AnalyzerWorkbench } from "@/components/analyzer/analyzer-workbench";
import { getOrCreateProfile } from "@/lib/db/profiles";
import { isLanguageId, type LanguageId } from "@/lib/analysis/languages";

export const metadata: Metadata = {
  title: "Analyzer · ComplexityLab",
  description:
    "Paste code, run the analyzer, and see its time and space complexity broken down on the gradient.",
};

export default async function AnalyzerPage() {
  // Honor the profile's preferred language; fall back gracefully when the
  // database is unreachable or the stored value is stale/unknown.
  const profile = await getOrCreateProfile();
  const preferred = profile.ok ? profile.data.preferredLanguage : "typescript";
  const initialLanguage: LanguageId = isLanguageId(preferred)
    ? preferred
    : "typescript";

  return <AnalyzerWorkbench initialLanguage={initialLanguage} />;
}
