import { Logo } from "./logo";
import { NavList } from "./nav-list";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line-subtle bg-surface-card lg:flex">
      <div className="flex h-14 items-center border-b border-line-subtle px-6">
        <Logo />
      </div>

      <NavList />

      <div className="border-t border-line-subtle p-4">
        <div className="rounded-ds-md border border-line-subtle bg-surface-panel px-3 py-2 font-mono text-xs uppercase tracking-label text-ink-muted">
          Free plan · early access
        </div>
      </div>
    </aside>
  );
}
