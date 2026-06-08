import type { Metadata } from "next";
import { WelcomeCard } from "@/components/readouts/welcome-card";
import { RecentAnalyses } from "@/components/readouts/recent-analyses";
import { SavedSnippets } from "@/components/readouts/saved-snippets";
import { ProgressOverview } from "@/components/readouts/progress-overview";
import { QuickActions } from "@/components/readouts/quick-actions";

export const metadata: Metadata = {
  title: "Dashboard · ComplexityLab",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WelcomeCard />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecentAnalyses />
          <SavedSnippets />
        </div>
        <div className="space-y-6">
          <ProgressOverview />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
