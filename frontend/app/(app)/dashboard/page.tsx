import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Bookmark, History, ScanLine, TriangleAlert } from "lucide-react";
import {
  WelcomeCard,
  WelcomeCardSkeleton,
} from "@/components/readouts/welcome-card";
import { RecentAnalyses } from "@/components/readouts/recent-analyses";
import { SavedSnippets } from "@/components/readouts/saved-snippets";
import { ProgressOverview } from "@/components/readouts/progress-overview";
import { QuickActions } from "@/components/readouts/quick-actions";
import { LevelCard } from "@/components/progress/level-card";
import { StreakCard } from "@/components/progress/streak-card";
import { AchievementGrid } from "@/components/progress/achievement-grid";
import { ActivityChart } from "@/components/progress/activity-chart";
import { buttonClassName } from "@/components/ui/button";
import { listAnalyses } from "@/lib/db/analyses";
import { listSnippets } from "@/lib/db/snippets";
import {
  getProgress,
  listXpHistory,
  listUnlockedAchievements,
} from "@/lib/db/progress";
import { computeDashboardStats, computeLanguageMix } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Dashboard - ComplexityLab",
};

export default async function DashboardPage() {
  const [analysesRes, snippetsRes, progressRes, historyRes, unlockedRes] =
    await Promise.all([
      listAnalyses(50),
      listSnippets(50),
      getProgress(),
      listXpHistory(30),
      listUnlockedAchievements(),
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

  const progress = progressRes.ok ? progressRes.data : null;
  const xpHistory = historyRes.ok ? historyRes.data : [];
  const unlockedKeys = unlockedRes.ok ? unlockedRes.data.map((a) => a.key) : [];
  const totalXp = progress?.xp ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Suspense fallback={<WelcomeCardSkeleton />}>
        <WelcomeCard />
      </Suspense>

      <section className="overflow-hidden rounded-ds-xl border border-line-subtle bg-gradient-to-br from-primary/12 via-card/90 to-card shadow-ds-xl">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-mono text-2xs uppercase tracking-label text-primary">
              Command center
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
              Keep your complexity practice moving.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base">
              Start with a fresh analysis, revisit saved verdicts, and watch your progress compound into reusable intuition.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/analyzer" className={buttonClassName({ size: "lg" })}>
              <ScanLine className="h-4 w-4" aria-hidden />
              New analysis
            </Link>
            <Link
              href="/analyses"
              className={buttonClassName({ variant: "outline", size: "lg" })}
            >
              Review history
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="grid border-t border-line-subtle bg-surface-panel/40 sm:grid-cols-3">
          {[
            { icon: History, label: "Saved analyses", value: analyses.length },
            { icon: Bookmark, label: "Saved snippets", value: snippets.length },
            { icon: ScanLine, label: "Total XP", value: totalXp },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 border-line-subtle p-5 sm:border-r last:sm:border-r-0"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-ds-md border border-line-accent bg-card text-primary shadow-inset-well">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-2xl font-semibold tabular-nums text-ink-primary">
                    {item.value}
                  </p>
                  <p className="font-mono text-2xs uppercase tracking-label text-ink-muted">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {dbError && (
        <div className="flex items-start gap-2.5 rounded-ds-md border border-line bg-[var(--warn-bg)] px-4 py-3 text-sm text-ink-secondary">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          <span>
            <span className="font-medium text-ink-primary">
              Your data is temporarily unavailable.
            </span>{" "}
            Showing empty placeholders for now - please refresh in a moment.
          </span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <RecentAnalyses analyses={analyses.slice(0, 5)} />
          <SavedSnippets snippets={snippets.slice(0, 5)} />
        </div>
        <div className="space-y-8">
          <LevelCard progress={progress} />
          <StreakCard progress={progress} />
          <ProgressOverview stats={stats} metrics={metrics} />
          <QuickActions />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart history={xpHistory} />
        </div>
        <div>
          <AchievementGrid unlockedKeys={unlockedKeys} />
        </div>
      </div>
    </div>
  );
}
