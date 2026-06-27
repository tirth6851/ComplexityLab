import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { PageTitle } from "./page-title";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line-subtle bg-card/75 px-3 shadow-ds-sm backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3 text-sm">
        <MobileNav />
        <Logo className="sm:hidden" showWordmark={false} />
        <div className="hidden min-w-0 sm:block">
          <PageTitle />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <AccountMenu />
      </div>
    </header>
  );
}