import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Big-O Cheat Sheet: Time & Space Complexity Reference",
  description:
    "A scannable reference for the common Big-O complexity classes — O(1) through O(n!) — with plain-English explanations, code examples, and where each one shows up in real algorithms.",
  alternates: { canonical: "/complexity-cheatsheet" },
  openGraph: {
    title: "Big-O Cheat Sheet: Time & Space Complexity Reference",
    description:
      "A scannable reference for the common Big-O complexity classes, with code examples and where each one shows up in real algorithms.",
    url: "/complexity-cheatsheet",
    // "article" is the only OpenGraph type the Metadata type allows modifiedTime on.
    type: "article",
    modifiedTime: "2026-07-25",
  },
};

const CLASSES = [
  {
    notation: "O(1)",
    name: "Constant",
    whenItAppears:
      "Array index access, hash map lookups, arithmetic operations — anything that does the same fixed amount of work regardless of input size.",
    example: "const first = array[0];",
  },
  {
    notation: "O(log n)",
    name: "Logarithmic",
    whenItAppears:
      "Binary search, balanced binary search trees, and any algorithm that halves the problem size each step.",
    example: "while (low <= high) { mid = (low+high)/2; ... }",
    relatedHref: "/algorithms/binary-search",
    relatedLabel: "Binary Search — worked example",
  },
  {
    notation: "O(n)",
    name: "Linear",
    whenItAppears:
      "A single loop over the input — array traversal, linear search, computing a sum.",
    example: "for (const x of array) { sum += x; }",
  },
  {
    notation: "O(n log n)",
    name: "Linearithmic",
    whenItAppears:
      "Efficient comparison-based sorting (merge sort, heapsort, quicksort's average case), and divide-and-conquer algorithms that do O(n) work at each of O(log n) levels.",
    example: "array.sort(); // typical O(n log n) implementation",
    relatedHref: "/algorithms/merge-sort",
    relatedLabel: "Merge Sort — worked example",
  },
  {
    notation: "O(n²)",
    name: "Quadratic",
    whenItAppears:
      "Nested loops over the same input — bubble sort, insertion sort, checking all pairs in a collection, and quicksort's worst case on unlucky pivot choices.",
    example: "for (i of a) { for (j of a) { compare(i, j); } }",
    relatedHref: "/algorithms/quicksort",
    relatedLabel: "Quicksort — how it degrades to O(n²)",
  },
  {
    notation: "O(2ⁿ)",
    name: "Exponential",
    whenItAppears:
      "Naive recursive solutions that branch on every element — unoptimized recursive Fibonacci, brute-force subset generation.",
    example: "fib(n) = fib(n-1) + fib(n-2) // no memoization",
  },
  {
    notation: "O(n!)",
    name: "Factorial",
    whenItAppears:
      "Generating every permutation of a set, brute-force solutions to the traveling salesman problem.",
    example: "permutations(array) // all n! orderings",
  },
] as const;

export default function ComplexityCheatsheetPage() {
  return (
    <ContentPage
      eyebrow="Reference"
      title="Big-O Cheat Sheet"
      dek="The common time and space complexity classes, ranked from fastest to slowest, with plain-English explanations and where each one actually shows up in code."
      lastUpdated="2026-07-25"
    >
      <ContentSection heading="Complexity classes at a glance">
        <div className="overflow-x-auto rounded-ds-md border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-panel/60">
                <th scope="col" className="px-4 py-3 font-mono text-ink-primary">
                  Notation
                </th>
                <th scope="col" className="px-4 py-3 text-ink-primary">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-ink-primary">
                  When it appears
                </th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((row) => (
                <tr key={row.notation} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 align-top font-mono font-semibold text-primary">
                    {row.notation}
                  </td>
                  <td className="px-4 py-3 align-top font-medium text-ink-primary">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-secondary">
                    {row.whenItAppears}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentSection>

      {CLASSES.map((row) => (
        <ContentSection key={row.notation} heading={`${row.notation} — ${row.name}`}>
          <p>{row.whenItAppears}</p>
          <CodeBlock>{row.example}</CodeBlock>
          {"relatedHref" in row && (
            <p>
              <Link href={row.relatedHref} className="text-primary hover:underline">
                {row.relatedLabel} →
              </Link>
            </p>
          )}
        </ContentSection>
      ))}

      <ContentSection heading="Growth rate, roughly ordered">
        <p>
          From fastest-growing input handling to slowest, for an input of size{" "}
          <code className="font-mono text-sm text-ink-primary">n</code>:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>O(1) — constant</li>
          <li>O(log n) — logarithmic</li>
          <li>O(n) — linear</li>
          <li>O(n log n) — linearithmic</li>
          <li>O(n²) — quadratic</li>
          <li>O(2ⁿ) — exponential</li>
          <li>O(n!) — factorial</li>
        </ul>
        <p>
          As <code className="font-mono text-sm text-ink-primary">n</code> grows, the gap
          between these classes widens dramatically — an O(n²) algorithm on 10,000 items does
          100 million operations, while an O(n log n) algorithm does roughly 130,000.
        </p>
      </ContentSection>

      <ContentSection heading="Next steps">
        <p>
          If you want the reasoning behind these classifications — how to actually look at a
          loop or a recursive function and derive its Big-O — read the full guide:
        </p>
        <p>
          <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
            How to Analyze Time Complexity of Any Algorithm →
          </Link>
        </p>
        <p>
          This table covers time complexity — memory usage is analyzed the same way. See{" "}
          <Link href="/guides/space-complexity-explained" className="text-primary hover:underline">
            Space Complexity Explained →
          </Link>
        </p>
      </ContentSection>
    </ContentPage>
  );
}
