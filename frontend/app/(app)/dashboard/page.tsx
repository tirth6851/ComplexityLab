import type { Metadata } from "next";
import { Suspense } from "react";
import { TriangleAlert } from "lucide-react";
import {
  WelcomeCard,
  WelcomeCardSkeleton,
} from "@/components/readouts/welcome-card";
import { RecentAnalyses } from "@/components/readouts/recent-analyses";
import { SavedSnippets } from "@/components/readouts/saved-snippets";
import { ProgressOverview } from "@/components/readouts/progress-overview";
import { QuickActions } from "@/components/readouts/quick-actions";
import { listAnalyses } from "@/lib/db/analyses";
import { listSnippets } from "@/lib/db/snippets";
import { computeDashboardStats, computeLanguageMix } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Dashboard · ComplexityLab",
};

export default async function DashboardPage() {
  const [analysesRes, snippetsRes] = await Promise.all([
    listAnalyses(50),
    listSnippets(50),
  ]);

  const analyses = analysesRes.ok ? analysesRes.data : [];
  const snippets = snippetsRes.ok ? snippetsRes.data : [];
  const dbError = !analysesRes.ok
    ? analysesRes.error
    : !snippetsRes.ok
      ? snippetsRes.error
      : null;

  const stats = computeDashboardStats(analyses, snippets);
  const metrics = computeLanguageMix(analyses);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Suspense fallback={<WelcomeCardSkeleton />}>
        <WelcomeCard />
      </Suspense>

      {dbError && (
        <div className="flex items-start gap-2.5 rounded-ds-md border border-line bg-[var(--warn-bg)] px-4 py-3 text-sm text-ink-secondary">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          <span>
            <span className="font-medium text-ink-primary">
              Your data is temporarily unavailable.
            </span>{" "}
            Showing empty placeholders for now — please refresh in a moment.
          </span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <RecentAnalyses analyses={analyses.slice(0, 5)} />
          <SavedSnippets snippets={snippets.slice(0, 5)} />
        </div>
        <div className="space-y-8">
          <ProgressOverview stats={stats} metrics={metrics} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
