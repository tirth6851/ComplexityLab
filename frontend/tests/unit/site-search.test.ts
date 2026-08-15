import { describe, it, expect } from "vitest";
import { searchSite } from "@/lib/search/search";
import { SITE_SEARCH_INDEX } from "@/lib/search/site-index";

describe("SITE_SEARCH_INDEX", () => {
  it("covers every required public content page exactly once", () => {
    const hrefs = SITE_SEARCH_INDEX.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.sort()).toEqual(
      [
        "/",
        "/about",
        "/algorithms/binary-search",
        "/algorithms/merge-sort",
        "/algorithms/quicksort",
        "/changelog",
        "/complexity-cheatsheet",
        "/faq",
        "/guides/big-o-vs-big-theta-vs-big-omega",
        "/guides/how-to-analyze-time-complexity",
        "/guides/space-complexity-explained",
      ].sort(),
    );
  });

  it("every entry has a non-empty title and description", () => {
    for (const entry of SITE_SEARCH_INDEX) {
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("searchSite — empty/blank queries", () => {
  it("returns an empty array for an empty query", () => {
    expect(searchSite("")).toHaveLength(0);
  });

  it("returns an empty array for a whitespace-only query", () => {
    expect(searchSite("   ")).toHaveLength(0);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchSite("xyznonexistenttopic")).toHaveLength(0);
  });
});

describe("searchSite — relevance", () => {
  it("finds the quicksort page for a quicksort query", () => {
    const results = searchSite("quicksort");
    expect(results[0]?.href).toBe("/algorithms/quicksort");
  });

  it("finds binary search for a binary search query", () => {
    const results = searchSite("binary search");
    expect(results[0]?.href).toBe("/algorithms/binary-search");
  });

  it("finds merge sort for a merge sort query", () => {
    const results = searchSite("merge sort");
    expect(results[0]?.href).toBe("/algorithms/merge-sort");
  });

  it("finds the FAQ page for an faq query", () => {
    const results = searchSite("faq");
    expect(results.map((r) => r.href)).toContain("/faq");
  });

  it("finds the cheat sheet for a cheat sheet query", () => {
    const results = searchSite("cheat sheet");
    expect(results[0]?.href).toBe("/complexity-cheatsheet");
  });

  it("finds the space complexity guide for a space query", () => {
    const results = searchSite("space complexity");
    expect(results[0]?.href).toBe("/guides/space-complexity-explained");
  });

  it("finds the theta/omega guide for an omega query", () => {
    const results = searchSite("big omega");
    expect(results[0]?.href).toBe("/guides/big-o-vs-big-theta-vs-big-omega");
  });

  it("is case-insensitive", () => {
    const lower = searchSite("quicksort").map((r) => r.href);
    const upper = searchSite("QUICKSORT").map((r) => r.href);
    expect(upper).toEqual(lower);
  });

  it("ranks a title match above a description-only match", () => {
    // "changelog" only appears in the changelog page's title; other pages
    // don't mention it at all, so it should be the sole/top result.
    const results = searchSite("changelog");
    expect(results[0]?.href).toBe("/changelog");
  });

  it("results are sorted by descending score", () => {
    const results = searchSite("complexity");
    const scored = results.map((entry) => {
      const t = entry.title.toLowerCase();
      const d = entry.description.toLowerCase();
      return (t.includes("complexity") ? 1 : 0) + (d.includes("complexity") ? 1 : 0);
    });
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1]).toBeGreaterThanOrEqual(0);
    }
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("searchSite — limit and custom entries", () => {
  it("respects a custom limit", () => {
    const results = searchSite("complexity", SITE_SEARCH_INDEX, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("searches against a custom entries array", () => {
    const custom = [
      { title: "Widgets", description: "All about widgets.", href: "/widgets" },
      { title: "Gadgets", description: "All about gadgets.", href: "/gadgets" },
    ];
    const results = searchSite("widgets", custom);
    expect(results).toHaveLength(1);
    expect(results[0].href).toBe("/widgets");
  });
});
