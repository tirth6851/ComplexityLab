import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground sm:flex">
          <Search className="h-4 w-4" />
          <span>Search…</span>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
