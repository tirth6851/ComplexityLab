"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchSite } from "@/lib/search/search";
import type { SiteSearchEntry } from "@/lib/search/site-index";

/**
 * Decouples SiteSearchTrigger from SiteSearch — a trigger can be rendered
 * anywhere in the tree (e.g. a nav bar) without needing to share React state
 * with the palette that owns the overlay.
 */
const OPEN_EVENT = "complexitylab:site-search-open";

function requestSiteSearchOpen() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Visible "Search (⌘K)" affordance. Works with any mounted <SiteSearch />. */
export function SiteSearchTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={requestSiteSearchOpen}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-ds-md border border-line-subtle bg-surface-panel/40 px-3 text-sm text-ink-secondary shadow-ds-sm transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5" aria-hidden="true" />
      Search
      <kbd className="ml-1 rounded-ds-sm border border-line-subtle bg-surface-inset px-1.5 py-0.5 font-mono text-2xs text-ink-muted">
        ⌘K
      </kbd>
    </button>
  );
}

/**
 * Cmd/Ctrl+K command-palette search over the public content pages.
 * Renders nothing visible by default — mount once and it listens globally.
 */
export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => searchSite(query), [query]);

  const close = React.useCallback(() => setOpen(false), []);

  // Fresh palette state each time it opens — a stale query from last time
  // reads as a bug, not a feature, in a command palette. Reset happens at the
  // open call site (not in an effect keyed on `open`) to avoid a cascading
  // extra render.
  const openPalette = React.useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, openPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, openPalette);
    };
  }, [openPalette]);

  function navigateTo(entry: SiteSearchEntry) {
    close();
    router.push(entry.href);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[activeIndex];
      if (entry) navigateTo(entry);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Search"
      description="Search ComplexityLab's pages, guides, and algorithms."
      initialFocusRef={inputRef}
    >
      <div className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          aria-label="Search pages"
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
          placeholder="Search pages, guides, algorithms…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="site-search-results"
          aria-activedescendant={
            results.length > 0 ? `site-search-result-${activeIndex}` : undefined
          }
          autoComplete="off"
        />

        {query.trim().length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-ink-muted">
            Type to search pages.
          </p>
        ) : results.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-ink-muted">
            No pages match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <ul id="site-search-results" role="listbox" aria-label="Search results" className="flex flex-col gap-1">
            {results.map((entry, index) => (
              <li key={entry.href} role="presentation">
                <Link
                  id={`site-search-result-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  href={entry.href}
                  onClick={close}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "block rounded-ds-md border border-transparent px-3 py-2.5 transition-colors",
                    index === activeIndex
                      ? "border-primary/30 bg-surface-raised text-ink-primary"
                      : "hover:bg-surface-raised/70",
                  )}
                >
                  <p className="truncate text-sm font-semibold text-ink-primary">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-secondary">
                    {entry.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t border-line-subtle pt-2.5 text-2xs text-ink-faint">
          <kbd className="rounded-ds-sm border border-line-subtle bg-surface-inset px-1 py-0.5 font-mono">
            Esc
          </kbd>{" "}
          to close
        </p>
      </div>
    </Dialog>
  );
}
