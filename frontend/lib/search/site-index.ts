import { SITE } from "@/constants/site";

export interface SiteSearchEntry {
  title: string;
  description: string;
  href: string;
}

/**
 * Static index of public content pages for the Cmd/Ctrl+K search palette.
 * Copy is pulled verbatim from each page's `export const metadata` (title +
 * description) so the palette can't drift from what's actually on the page —
 * update the source page's metadata and mirror the change here.
 */
export const SITE_SEARCH_INDEX: SiteSearchEntry[] = [
  {
    title: `${SITE.name} - Master Big-O with Visual Code Tracing`,
    description:
      "Analyze code, understand time and space complexity, visualize execution flow, and improve solutions with AI-powered guidance.",
    href: "/",
  },
  {
    title: `About · ${SITE.name}`,
    description:
      "Learn about ComplexityLab — the team behind it, the mission, and the technologies that power it.",
    href: "/about",
  },
  {
    title: "Big-O and Complexity Analysis FAQ",
    description:
      "Answers to common questions about Big-O notation, time and space complexity, and how to analyze algorithms — what O(1) means, why constants drop out, and more.",
    href: "/faq",
  },
  {
    title: "Changelog",
    description:
      "What's new in ComplexityLab — new content pages, SEO and platform improvements, and product updates.",
    href: "/changelog",
  },
  {
    title: "Big-O Cheat Sheet: Time & Space Complexity Reference",
    description:
      "A scannable reference for the common Big-O complexity classes — O(1) through O(n!) — with plain-English explanations, code examples, and where each one shows up in real algorithms.",
    href: "/complexity-cheatsheet",
  },
  {
    title: "How to Analyze Time Complexity of Any Algorithm",
    description:
      "A step-by-step method for deriving Big-O from source code: single loops, nested loops, recursion, logarithmic behavior, and simplifying to the dominant term.",
    href: "/guides/how-to-analyze-time-complexity",
  },
  {
    title: "Space Complexity Explained: Auxiliary Space vs. Input Space",
    description:
      "What space complexity actually measures, the difference between auxiliary space and input space, why recursion costs stack space, and the mistakes learners make when analyzing it.",
    href: "/guides/space-complexity-explained",
  },
  {
    title: "Big-O vs. Big-Theta vs. Big-Omega Explained",
    description:
      "The difference between O (upper bound), Ω (lower bound), and Θ (tight bound) notation, why 'Big-O' gets used loosely for all three in practice, and worked examples of each.",
    href: "/guides/big-o-vs-big-theta-vs-big-omega",
  },
  {
    title: "Binary Search Time Complexity Explained",
    description:
      "How binary search achieves O(log n) time complexity, why the input must be sorted, a step-by-step worked example, and the iterative vs. recursive implementations.",
    href: "/algorithms/binary-search",
  },
  {
    title: "Merge Sort Time Complexity: O(n log n) Explained",
    description:
      "How merge sort's divide-and-conquer structure guarantees O(n log n) time in every case, how the merge step works, and its O(n) space cost — with a worked example.",
    href: "/algorithms/merge-sort",
  },
  {
    title: "Quicksort Time Complexity: Best, Average, and Worst Case",
    description:
      "How quicksort's partition step works, why it's O(n log n) on average but O(n²) in the worst case, how pivot choice affects that risk, and a worked example.",
    href: "/algorithms/quicksort",
  },
];
