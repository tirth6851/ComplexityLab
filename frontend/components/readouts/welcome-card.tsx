import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shown while the signed-in user resolves. */
export function WelcomeCardSkeleton() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
      <div className="space-y-4 p-6 sm:p-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Greets the REAL signed-in user (via Clerk currentUser). The rest of the
 * dashboard renders real Supabase-derived data (recent analyses, saved
 * snippets, and computed stats); this card is the personalized greeting.
 */
export async function WelcomeCard() {
  const user = await currentUser();
  const name = user?.firstName ?? "there";

  return (
    <Card className="relative overflow-hidden border-line-accent bg-gradient-to-br from-primary/12 via-card to-card">
      <div className="absolute inset-0 bg-grid-dots opacity-60" aria-hidden />
      <div className="absolute right-8 top-8 hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-2xs uppercase tracking-label text-primary sm:block">
        AI workspace
      </div>
      <div className="relative p-6 sm:p-8 lg:p-10">
        <p className="font-mono text-xs uppercase tracking-label text-primary">
          ComplexityLab
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome back, {name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
          Pick up where you left off. Analyze code, review saved snippets, and
          track your complexity intuition over time.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/analyzer" className={buttonClassName()}>
            <ScanLine className="h-4 w-4" />
            New analysis
          </Link>
          <Link
            href="/snippets"
            className={buttonClassName({ variant: "outline" })}
          >
            View snippets
          </Link>
        </div>
      </div>
    </Card>
  );
}
