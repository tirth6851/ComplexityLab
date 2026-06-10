import type { Metadata } from "next";
import { AnalyzerWorkbench } from "@/components/analyzer/analyzer-workbench";

export const metadata: Metadata = {
  title: "Analyzer · ComplexityLab",
  description:
    "Paste code, run the analyzer, and see its time and space complexity broken down on the gradient.",
};

export default function AnalyzerPage() {
  return <AnalyzerWorkbench />;
}
