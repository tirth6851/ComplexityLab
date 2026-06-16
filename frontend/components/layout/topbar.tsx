import { UserButton } from "@clerk/nextjs";
import { MobileNav } from "./mobile-nav";
import { PageTitle } from "./page-title";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-card/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3 text-sm">
        <MobileNav />
        <PageTitle />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="rounded-full border border-line bg-surface-panel p-0.5">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
