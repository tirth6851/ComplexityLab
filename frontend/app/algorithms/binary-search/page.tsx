import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Binary Search Time Complexity Explained",
  description:
    "How binary search achieves O(log n) time complexity, why the input must be sorted, a step-by-step worked example, and the iterative vs. recursive implementations.",
  alternates: { canonical: "/algorithms/binary-search" },
  openGraph: {
    title: "Binary Search Time Complexity Explained",
    description:
      "How binary search achieves O(log n) time complexity, why the input must be sorted, and a step-by-step worked example.",
    url: "/algorithms/binary-search",
  },
};

export default function BinarySearchPage() {
  return (
    <ContentPage
      eyebrow="Algorithm"
      title="Binary Search"
      dek="A search algorithm that finds a target value in a sorted collection by repeatedly halving the search space — O(log n) time instead of O(n)."
    >
      <ContentSection heading="What is binary search?">
        <p>
          Binary search locates a target value inside a <strong className="text-ink-primary">sorted</strong>{" "}
          array by comparing the target to the middle element and eliminating half of the
          remaining search space at each step. Instead of checking elements one at a time like a
          linear scan, it discards half the candidates with every comparison.
        </p>
        <p>
          Compare that to linear search, which checks each element in order and, in the worst
          case, looks at every single one — O(n). Binary search&rsquo;s halving strategy is what
          gets it down to O(log n).
        </p>
      </ContentSection>

      <ContentSection heading="The prerequisite: the data must be sorted">
        <p>
          Binary search only works because a sorted array lets you make a guarantee at every
          step: if the middle element is greater than the target, the target — if it exists — must
          be to the left; if it&rsquo;s smaller, the target must be to the right. On unsorted data
          that guarantee doesn&rsquo;t hold, and the algorithm can&rsquo;t safely discard half the
          array.
        </p>
        <p>
          If your data isn&rsquo;t already sorted, sorting it first costs O(n log n) (see{" "}
          <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
            merge sort
          </Link>
          ) — which only pays off if you plan to search the same data multiple times.
        </p>
      </ContentSection>

      <ContentSection heading="Worked example">
        <p>
          Searching for <code className="font-mono text-sm text-ink-primary">23</code> in{" "}
          <code className="font-mono text-sm text-ink-primary">
            [2, 5, 8, 12, 16, 23, 38, 45, 56, 72]
          </code>{" "}
          (indices 0–9):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Step 1:</strong> low = 0, high = 9, mid = 4 →
            value 16. 16 &lt; 23, so search the right half: low = 5.
          </li>
          <li>
            <strong className="text-ink-primary">Step 2:</strong> low = 5, high = 9, mid = 7 →
            value 45. 45 &gt; 23, so search the left half: high = 6.
          </li>
          <li>
            <strong className="text-ink-primary">Step 3:</strong> low = 5, high = 6, mid = 5 →
            value 23. Match found at index 5.
          </li>
        </ul>
        <p>
          Ten elements, found in three comparisons — a linear scan could have taken up to ten.
        </p>
      </ContentSection>

      <ContentSection heading="Why it's O(log n)">
        <p>
          Each comparison discards half of the remaining elements. Starting from n elements, after
          one comparison n/2 remain, then n/4, then n/8, and so on. The question &ldquo;how many
          halvings does it take to get from n down to 1?&rdquo; is exactly what{" "}
          <code className="font-mono text-sm text-ink-primary">log₂(n)</code> answers. For 1,024
          elements, that&rsquo;s only 10 comparisons; for 1,000,000 elements, only about 20.
        </p>
        <p>
          This is the same halving pattern covered in the{" "}
          <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
            time complexity guide
          </Link>
          &rsquo;s section on logarithmic behavior.
        </p>
      </ContentSection>

      <ContentSection heading="Time and space complexity">
        <div className="overflow-x-auto rounded-ds-md border border-line">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-panel/60">
                <th scope="col" className="px-4 py-3 text-ink-primary">Case</th>
                <th scope="col" className="px-4 py-3 font-mono text-ink-primary">Time</th>
                <th scope="col" className="px-4 py-3 font-mono text-ink-primary">Space</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-ink-secondary">Best case (target is the middle element)</td>
                <td className="px-4 py-3 font-mono text-primary">O(1)</td>
                <td className="px-4 py-3 font-mono text-primary">O(1)</td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-ink-secondary">Average case</td>
                <td className="px-4 py-3 font-mono text-primary">O(log n)</td>
                <td className="px-4 py-3 font-mono text-primary">O(1) iterative / O(log n) recursive</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-secondary">Worst case (target absent or at an end)</td>
                <td className="px-4 py-3 font-mono text-primary">O(log n)</td>
                <td className="px-4 py-3 font-mono text-primary">O(1) iterative / O(log n) recursive</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The space complexity difference between the two implementations matters: the iterative
          version uses a fixed number of variables regardless of input size, while the recursive
          version&rsquo;s call stack grows with each halving — O(log n) stack frames.
        </p>
      </ContentSection>

      <ContentSection heading="Iterative vs. recursive">
        <p>The iterative version uses O(1) auxiliary space:</p>
        <CodeBlock>{`function binarySearch(sortedNums, target) {
  let low = 0, high = sortedNums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedNums[mid] === target) return mid;
    if (sortedNums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`}</CodeBlock>
        <p>
          The recursive version is often more readable but trades that for O(log n) call-stack
          space:
        </p>
        <CodeBlock>{`function binarySearch(sortedNums, target, low = 0, high = sortedNums.length - 1) {
  if (low > high) return -1;
  const mid = Math.floor((low + high) / 2);
  if (sortedNums[mid] === target) return mid;
  return sortedNums[mid] < target
    ? binarySearch(sortedNums, target, mid + 1, high)
    : binarySearch(sortedNums, target, low, mid - 1);
}`}</CodeBlock>
        <p>
          Both do the same O(log n) number of comparisons — the difference is purely in space, and
          in most languages the iterative version is preferred for exactly that reason.
        </p>
      </ContentSection>

      <ContentSection heading="Related pages">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
              Big-O Cheat Sheet
            </Link>{" "}
            — see where O(log n) ranks among the other complexity classes.
          </li>
          <li>
            <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
              How to Analyze Time Complexity of Any Algorithm
            </Link>{" "}
            — the general method binary search is a worked example of.
          </li>
          <li>
            <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
              Merge Sort
            </Link>{" "}
            — the O(n log n) sort you&rsquo;d use to prepare unsorted data for binary search.
          </li>
          <li>
            <Link href="/guides/space-complexity-explained" className="text-primary hover:underline">
              Space Complexity Explained
            </Link>{" "}
            — why the recursive version above costs O(log n) stack space while the iterative
            version costs O(1).
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
