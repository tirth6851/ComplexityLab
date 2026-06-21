"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "complexitylab.sidebar.collapsed";

function readStoredCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeToSidebarCollapse(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("complexitylab:sidebar-collapse", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("complexitylab:sidebar-collapse", onStoreChange);
  };
}

function getServerSnapshot() {
  return false;
}

function setStoredCollapsed(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* storage unavailable - collapse still works for this interaction */
  }
  window.dispatchEvent(new Event("complexitylab:sidebar-collapse"));
}

export function Sidebar() {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarCollapse,
    readStoredCollapsed,
    getServerSnapshot,
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setStoredCollapsed(!readStoredCollapsed());
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <aside
      className={cn(
        "relative z-20 hidden shrink-0 flex-col border-r border-line-subtle bg-card/75 shadow-ds-xl backdrop-blur-xl transition-[width] duration-200 ease-ds lg:flex",
        collapsed ? "w-[68px]" : "w-[296px]",
      )}
      data-collapsed={collapsed}
    >
      <div
        className={cn(
          "flex h-20 items-center border-b border-line-subtle transition-[padding] duration-200",
          collapsed ? "justify-center px-2.5" : "justify-between px-6",
        )}
      >
        <Logo showWordmark={!collapsed} />
        {!collapsed && (
          <button
            type="button"
            onClick={() => setStoredCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Ctrl+B)"
            className="inline-flex h-9 w-9 items-center justify-center rounded-ds-md border border-line-subtle bg-surface-panel text-ink-muted transition-colors hover:border-primary/35 hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center border-b border-line-subtle px-2.5 py-2.5">
          <button
            type="button"
            onClick={() => setStoredCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar (Ctrl+B)"
            className="inline-flex h-9 w-9 items-center justify-center rounded-ds-md border border-line-subtle bg-surface-panel text-ink-muted transition-colors hover:border-primary/35 hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      <NavList collapsed={collapsed} />

      <div
        className={cn(
          "border-t border-line-subtle p-4 transition-opacity duration-150",
          collapsed && "pointer-events-none hidden opacity-0",
        )}
      >
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