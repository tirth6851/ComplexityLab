import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonClassName } from "@/components/ui/button";

/**
 * Minimal landing page. Links into the auth + dashboard flows so the Phase 2
 * shell can be exercised end-to-end. Not a product marketing page.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Logo />
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Foundation ready</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Authentication and the dashboard shell are wired up.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/sign-in" className={buttonClassName()}>
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className={buttonClassName({ variant: "outline" })}
        >
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
