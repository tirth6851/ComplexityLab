import { Logo } from "./logo";
import { NavList } from "./nav-list";

export function Sidebar() {
  return (
    <aside className="relative z-20 hidden w-72 shrink-0 flex-col border-r border-line-subtle bg-card/75 shadow-ds-xl backdrop-blur-xl lg:flex">
      <div className="flex h-20 items-center border-b border-line-subtle px-6">
        <Logo />
      </div>

      <NavList />

      <div className="border-t border-line-subtle p-4">
        <div className="trace-rail overflow-hidden rounded-ds-lg border border-line-subtle bg-surface-panel/70 p-4 shadow-inset-well">
          <p className="font-mono text-2xs uppercase tracking-label text-primary">
            Free plan
          </p>
          <p className="mt-1 text-sm font-medium text-ink-primary">
            Early access workspace
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Analyze, save, and revisit complexity results.
          </p>
        </div>
      </div>
    </aside>
  );
}
