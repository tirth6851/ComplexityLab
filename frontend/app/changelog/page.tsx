import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What's new in ComplexityLab — new content pages, SEO and platform improvements, and product updates.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    title: "ComplexityLab Changelog",
    description: "What's new in ComplexityLab — new content pages, SEO fixes, and product updates.",
    url: "/changelog",
  },
};

const ENTRIES = [
  {
    date: "2026-07-25",
    title: "Notation guide, FAQ, and changelog",
    body: "Added a guide explaining the difference between Big-O, Big-Omega, and Big-Theta notation, a frequently-asked-questions reference page, and this changelog.",
  },
  {
    date: "2026-07-24",
    title: "Quicksort and space complexity guide",
    body: "Added a quicksort deep dive covering partitioning, pivot strategy, and worst-case behavior, plus a guide explaining auxiliary space, input space, and recursion stack space.",
  },
  {
    date: "2026-07-23",
    title: "Binary search and merge sort pages",
    body: "Added dedicated pages walking through binary search's O(log n) behavior and merge sort's O(n log n) guarantee, each with worked examples and code.",
  },
  {
    date: "2026-07-22",
    title: "Big-O cheat sheet and time complexity guide",
    body: "Published a scannable reference for the common complexity classes and a step-by-step guide to deriving time complexity from source code.",
  },
  {
    date: "2026-07-20",
    title: "SEO and indexing fixes",
    body: "Fixed a canonical-host mismatch between the apex and www domains, added metadataBase and per-page canonical tags, and trimmed the sitemap to indexable public routes only.",
  },
] as const;

export default function ChangelogPage() {
  return (
    <ContentPage
      eyebrow="Updates"
      title="Changelog"
      dek="What's new in ComplexityLab, most recent first."
    >
      <ContentSection heading="Recent updates">
        <ul className="space-y-6">
          {ENTRIES.map((entry) => (
            <li key={entry.date + entry.title} className="border-l-2 border-line pl-4">
              <time dateTime={entry.date} className="font-mono text-xs uppercase tracking-label text-ink-muted">
                {entry.date}
              </time>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink-primary">
                {entry.title}
              </h3>
              <p className="mt-1 text-base leading-7 text-ink-secondary">{entry.body}</p>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection heading="Explore the content">
        <p>
          Browse the{" "}
          <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
            Big-O Cheat Sheet
          </Link>{" "}
          or read the{" "}
          <Link href="/faq" className="text-primary hover:underline">
            FAQ
          </Link>{" "}
          for quick answers.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
