import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine, TrendingUp, Zap, Flame } from "lucide-react";
import { LevelCard } from "@/components/progress/level-card";
import { StreakCard } from "@/components/progress/streak-card";
import { AchievementGrid } from "@/components/progress/achievement-grid";
import { ActivityChart } from "@/components/progress/activity-chart";
import { ProgressOverview } from "@/components/readouts/progress-overview";
import { buttonClassName } from "@/components/ui/button";
import {
  getProgress,
  listXpHistory,
  listUnlockedAchievements,
} from "@/lib/db/progress";
import { listAnalyses } from "@/lib/db/analyses";
import { listSnippets } from "@/lib/db/snippets";
import { computeDashboardStats, computeLanguageMix } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Progress - ComplexityLab",
};

export default async function ProgressPage() {
  const [analysesRes, snippetsRes, progressRes, historyRes, unlockedRes] =
    await Promise.all([
      listAnalyses(200),
      listSnippets(200),
      getProgress(),
      listXpHistory(30),
      listUnlockedAchievements(),
    ]);

  const analyses = analysesRes.ok ? analysesRes.data : [];
  const snippets = snippetsRes.ok ? snippetsRes.data : [];
  const progress = progressRes.ok ? progressRes.data : null;
  const xpHistory = historyRes.ok ? historyRes.data : [];
  const unlockedKeys = unlockedRes.ok
    ? unlockedRes.data.map((a) => a.key)
    : [];

  const stats = computeDashboardStats(analyses, snippets);
  const metrics = computeLanguageMix(analyses);

  const level = progress?.level ?? 1;
  const xp = progress?.xp ?? 0;
  const streak = progress?.currentStreak ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="overflow-hidden rounded-ds-xl border border-line-subtle bg-gradient-to-br from-primary/12 via-card/90 to-card shadow-ds-xl">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-mono text-2xs uppercase tracking-label text-primary">
              Learning journey
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
              Track your complexity mastery.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary sm:text-base">
              Every analysis sharpens your Big-O intuition. Maintain your streak, collect achievements, and watch your XP compound into real expertise.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/analyzer" className={buttonClassName({ size: "lg" })}>
              <ScanLine className="h-4 w-4" aria-hidden />
              New analysis
            </Link>
          </div>
        </div>
        <div className="grid border-t border-line-subtle bg-surface-panel/40 sm:grid-cols-3">
          {[
            { icon: TrendingUp, label: "Level", value: level },
            { icon: Zap, label: "Total XP", value: xp },
            { icon: Flame, label: "Day streak", value: streak },
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

      <div className="grid gap-6 sm:grid-cols-2">
        <LevelCard progress={progress} />
        <StreakCard progress={progress} />
      </div>

      <ActivityChart history={xpHistory} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressOverview stats={stats} metrics={metrics} />
        <AchievementGrid unlockedKeys={unlockedKeys} />
      </div>
    </div>
  );
}
