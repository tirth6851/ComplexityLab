import { currentUser } from "@clerk/nextjs/server";
import { ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Greets the REAL signed-in user (via Clerk currentUser). The rest of the
 * dashboard is mock data; this is the one live, personalized element.
 */
export async function WelcomeCard() {
  const user = await currentUser();
  const name = user?.firstName ?? "there";

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
      <div className="p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          ComplexityLab
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome back, {name}
        </h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Pick up where you left off. Analyze code, review saved snippets, and
          track your complexity intuition over time.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button>
            <ScanLine className="h-4 w-4" />
            New analysis
          </Button>
          <Button variant="outline">View snippets</Button>
        </div>
      </div>
    </Card>
  );
}
