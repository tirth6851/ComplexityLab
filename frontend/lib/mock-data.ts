import type {
  Analysis,
  DashboardStat,
  ProgressMetric,
  Snippet,
} from "@/types";

/**
 * MOCK DATA — Phase 2 dashboard shell only.
 * No backend, no persistence. Replaced by real Supabase queries in a later phase.
 */

export const recentAnalyses: Analysis[] = [
  {
    id: "a1",
    title: "quickSort(partition)",
    language: "TypeScript",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    createdAt: "2h ago",
  },
  {
    id: "a2",
    title: "dijkstra(graph, src)",
    language: "Python",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    createdAt: "Yesterday",
  },
  {
    id: "a3",
    title: "naiveSubstringSearch",
    language: "Go",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    createdAt: "2 days ago",
  },
  {
    id: "a4",
    title: "binarySearch(sorted)",
    language: "Rust",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    createdAt: "4 days ago",
  },
];

export const savedSnippets: Snippet[] = [
  {
    id: "s1",
    title: "Memoized Fibonacci",
    language: "TypeScript",
    tags: ["dp", "recursion"],
    savedAt: "1d ago",
  },
  {
    id: "s2",
    title: "Union-Find with path compression",
    language: "Java",
    tags: ["graph", "dsu"],
    savedAt: "3d ago",
  },
  {
    id: "s3",
    title: "Sliding window max",
    language: "Python",
    tags: ["array", "deque"],
    savedAt: "1w ago",
  },
];

export const progressMetrics: ProgressMetric[] = [
  { label: "Sorting", value: 78 },
  { label: "Graphs", value: 54 },
  { label: "Dynamic programming", value: 41 },
  { label: "Recursion", value: 66 },
];

export const dashboardStats: DashboardStat[] = [
  { label: "Analyses", value: "42", hint: "+6 this week" },
  { label: "Snippets", value: "18", hint: "3 languages" },
  { label: "Day streak", value: "7", hint: "keep it up" },
];
