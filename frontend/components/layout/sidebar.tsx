import { Logo } from "./logo";
import { NavList } from "./nav-list";

export function Sidebar() {
  return (
    <aside className="relative z-20 hidden w-72 shrink-0 flex-col border-r border-line bg-card/70 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center border-b border-line-subtle px-6">
        <Logo />
      </div>

      <NavList />

      <div className="border-t border-line-subtle p-4">
        <div className="overflow-hidden rounded-ds-lg border border-line bg-surface-panel/80 p-4">
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
