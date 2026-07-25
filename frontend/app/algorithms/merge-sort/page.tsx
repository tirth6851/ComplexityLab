import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Merge Sort Time Complexity: O(n log n) Explained",
  description:
    "How merge sort's divide-and-conquer structure guarantees O(n log n) time in every case, how the merge step works, and its O(n) space cost — with a worked example.",
  alternates: { canonical: "/algorithms/merge-sort" },
  openGraph: {
    title: "Merge Sort Time Complexity: O(n log n) Explained",
    description:
      "How merge sort's divide-and-conquer structure guarantees O(n log n) time in every case, and how the merge step works.",
    url: "/algorithms/merge-sort",
  },
};

export default function MergeSortPage() {
  return (
    <ContentPage
      eyebrow="Algorithm"
      title="Merge Sort"
      dek="A divide-and-conquer sorting algorithm that splits the input in half recursively, sorts each half, then merges the results — O(n log n) time in every case."
    >
      <ContentSection heading="Divide and conquer">
        <p>
          Merge sort solves the sorting problem by breaking it into smaller versions of itself: it
          splits the array in half, recursively sorts each half, then combines the two sorted
          halves into one sorted array. The recursion bottoms out at arrays of length 1, which are
          trivially &ldquo;sorted&rdquo; already.
        </p>
        <p>
          This divide-and-conquer shape — split the problem, solve the pieces, combine the results
          — is the same pattern behind{" "}
          <Link href="/algorithms/binary-search" className="text-primary hover:underline">
            binary search
          </Link>
          , though binary search only recurses into <em>one</em> half while merge sort recurses
          into <em>both</em>.
        </p>
      </ContentSection>

      <ContentSection heading="The merge step">
        <p>
          The actual sorting work happens in the merge step, not the split. Given two{" "}
          <strong className="text-ink-primary">already-sorted</strong> arrays, merging them into
          one sorted array takes a single linear pass: compare the front of each array, take the
          smaller one, and repeat until both arrays are exhausted.
        </p>
        <CodeBlock>{`function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }

  // append whatever remains — only one of these has leftover elements
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}`}</CodeBlock>
        <p>
          Merging two arrays of total size n takes O(n) — every element is looked at exactly once.
        </p>
      </ContentSection>

      <ContentSection heading="Full implementation">
        <CodeBlock>{`function mergeSort(nums) {
  if (nums.length <= 1) return nums;

  const mid = Math.floor(nums.length / 2);
  const left = mergeSort(nums.slice(0, mid));
  const right = mergeSort(nums.slice(mid));

  return merge(left, right);
}`}</CodeBlock>
      </ContentSection>

      <ContentSection heading="Why it's O(n log n)">
        <p>
          Think of the recursion as a tree. At the top level, one call handles all n elements. At
          the next level, two calls each handle n/2 elements — n elements of work total. One level
          down, four calls each handle n/4 elements — still n elements of work total. Every level
          of the tree does O(n) work in its merge steps, regardless of how many calls that level
          contains.
        </p>
        <p>
          The array halves at each level, so the tree has{" "}
          <code className="font-mono text-sm text-ink-primary">log₂(n)</code> levels — the same
          halving logic covered in the{" "}
          <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
            time complexity guide
          </Link>
          . Multiply: O(n) work per level × O(log n) levels = O(n log n) total.
        </p>
      </ContentSection>

      <ContentSection heading="Best, average, and worst case">
        <p>
          Unlike quicksort, merge sort&rsquo;s time complexity doesn&rsquo;t depend on the input
          order — it always splits the array exactly in half and always does a full O(n) merge at
          each level, regardless of whether the input is already sorted, reverse-sorted, or
          random.
        </p>
        <div className="overflow-x-auto rounded-ds-md border border-line">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-panel/60">
                <th scope="col" className="px-4 py-3 text-ink-primary">Case</th>
                <th scope="col" className="px-4 py-3 font-mono text-ink-primary">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-ink-secondary">Best</td>
                <td className="px-4 py-3 font-mono text-primary">O(n log n)</td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-ink-secondary">Average</td>
                <td className="px-4 py-3 font-mono text-primary">O(n log n)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-secondary">Worst</td>
                <td className="px-4 py-3 font-mono text-primary">O(n log n)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          That consistency is merge sort&rsquo;s main selling point over quicksort, which is
          O(n log n) on average but degrades to O(n²) on adversarial input.
        </p>
      </ContentSection>

      <ContentSection heading="Space complexity">
        <p>
          Merge sort is <strong className="text-ink-primary">not</strong> in-place: the merge step
          builds new arrays to hold the merged results rather than rearranging the input in place.
          That costs O(n) auxiliary space — at any given time, the temporary arrays across the
          recursion hold at most n elements total. This is the main tradeoff against in-place
          O(n log n) sorts like heapsort, which sorts in O(1) extra space but isn&rsquo;t stable.
        </p>
      </ContentSection>

      <ContentSection heading="Worked example">
        <p>
          Sorting <code className="font-mono text-sm text-ink-primary">[38, 27, 43, 3, 9, 82, 10]</code>:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Split:</strong> [38, 27, 43] and [3, 9, 82, 10]
          </li>
          <li>
            <strong className="text-ink-primary">Split again:</strong> [38], [27, 43], [3, 9], [82, 10]
          </li>
          <li>
            <strong className="text-ink-primary">Split to base case:</strong> [38], [27], [43],
            [3], [9], [82], [10] — all length 1, already &ldquo;sorted&rdquo;
          </li>
          <li>
            <strong className="text-ink-primary">Merge up:</strong> [27, 43], [3, 9], [10, 82]
            (and [38] stays as-is)
          </li>
          <li>
            <strong className="text-ink-primary">Merge up:</strong> [27, 38, 43], [3, 9, 10, 82]
          </li>
          <li>
            <strong className="text-ink-primary">Final merge:</strong>{" "}
            [3, 9, 10, 27, 38, 43, 82]
          </li>
        </ul>
      </ContentSection>

      <ContentSection heading="Related pages">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
              Big-O Cheat Sheet
            </Link>{" "}
            — see where O(n log n) ranks among the other complexity classes.
          </li>
          <li>
            <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
              How to Analyze Time Complexity of Any Algorithm
            </Link>{" "}
            — the general method, including how sequential and nested work combine.
          </li>
          <li>
            <Link href="/algorithms/binary-search" className="text-primary hover:underline">
              Binary Search
            </Link>{" "}
            — an O(log n) algorithm that depends on data merge sort can prepare.
          </li>
          <li>
            <Link href="/algorithms/quicksort" className="text-primary hover:underline">
              Quicksort
            </Link>{" "}
            — the in-place O(n log n)-average alternative, with a worst-case tradeoff merge sort
            avoids.
          </li>
          <li>
            <Link href="/guides/space-complexity-explained" className="text-primary hover:underline">
              Space Complexity Explained
            </Link>{" "}
            — why merge sort&rsquo;s O(n) auxiliary space is the tradeoff for its guaranteed time
            complexity.
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
