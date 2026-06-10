import { UserButton } from "@clerk/nextjs";
import { MobileNav } from "./mobile-nav";
import { PageTitle } from "./page-title";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line-subtle bg-card/85 px-4 [backdrop-filter:var(--blur-panel)] sm:px-6">
      <div className="flex items-center gap-3 text-sm">
        <MobileNav />
        <PageTitle />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
