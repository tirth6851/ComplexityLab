import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Quicksort Time Complexity: Best, Average, and Worst Case",
  description:
    "How quicksort's partition step works, why it's O(n log n) on average but O(n²) in the worst case, how pivot choice affects that risk, and a worked example.",
  alternates: { canonical: "/algorithms/quicksort" },
  openGraph: {
    title: "Quicksort Time Complexity: Best, Average, and Worst Case",
    description:
      "How quicksort's partition step works, why it's O(n log n) on average but O(n²) in the worst case, and how pivot choice affects that risk.",
    url: "/algorithms/quicksort",
  },
};

export default function QuicksortPage() {
  return (
    <ContentPage
      eyebrow="Algorithm"
      title="Quicksort"
      dek="A divide-and-conquer sort that picks a pivot, partitions the array around it, and recurses — O(n log n) on average, but O(n²) if the pivot choice keeps going wrong."
    >
      <ContentSection heading="The partition idea">
        <p>
          Quicksort picks one element as the <strong className="text-ink-primary">pivot</strong>,
          then rearranges the array so every element smaller than the pivot ends up to its left
          and every element larger ends up to its right. The pivot is now in its final sorted
          position. Recursing on the left and right sub-arrays finishes the sort.
        </p>
        <p>
          Unlike{" "}
          <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
            merge sort
          </Link>
          , which does its real work in the <em>combine</em> step after the recursion, quicksort
          does its real work in the <em>partition</em> step before the recursion — the array is
          already substantially sorted by the time the recursive calls happen.
        </p>
        <CodeBlock>{`function partition(nums, low, high) {
  const pivot = nums[high];   // choose the last element as pivot
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (nums[j] < pivot) {
      i++;
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
  }
  [nums[i + 1], nums[high]] = [nums[high], nums[i + 1]];
  return i + 1; // final index of the pivot
}`}</CodeBlock>
        <p>Partitioning n elements takes a single O(n) pass, exactly like merge sort&rsquo;s merge step.</p>
      </ContentSection>

      <ContentSection heading="Full implementation">
        <CodeBlock>{`function quicksort(nums, low = 0, high = nums.length - 1) {
  if (low < high) {
    const pivotIndex = partition(nums, low, high);
    quicksort(nums, low, pivotIndex - 1);
    quicksort(nums, pivotIndex + 1, high);
  }
  return nums;
}`}</CodeBlock>
      </ContentSection>

      <ContentSection heading="Why average case is O(n log n)">
        <p>
          If the pivot lands roughly in the middle of the range each time, the array splits into
          two halves of comparable size — the same balanced-recursion-tree shape as merge sort:
          O(n) partition work per level, O(log n) levels, O(n log n) total. This holds on average
          across random inputs, even though no single partition is guaranteed to split exactly in
          half.
        </p>
      </ContentSection>

      <ContentSection heading="Why worst case becomes O(n²)">
        <p>
          The risk is entirely about how <em>unbalanced</em> the partition is. If the pivot is
          always the smallest or largest remaining element — which happens on already-sorted or
          reverse-sorted input when the pivot is chosen as the first or last element — each
          partition step only removes <em>one</em> element from consideration instead of roughly
          half:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Partition call 1: n elements, O(n) work, leaves n − 1</li>
          <li>Partition call 2: n − 1 elements, O(n − 1) work, leaves n − 2</li>
          <li>…and so on down to 1</li>
        </ul>
        <p>
          That&rsquo;s n + (n − 1) + (n − 2) + &hellip; + 1, which sums to O(n²) — and instead of
          O(log n) recursion depth, you get O(n) depth, one level per element.
        </p>
      </ContentSection>

      <ContentSection heading="Pivot strategy impact">
        <p>
          The entire best/worst-case gap comes down to how the pivot is chosen:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">First or last element:</strong> simplest to
            implement, but degrades to O(n²) on already-sorted or reverse-sorted input — a
            realistic case, not just an adversarial one.
          </li>
          <li>
            <strong className="text-ink-primary">Random element:</strong> makes the worst case
            astronomically unlikely for any specific input, since an attacker would need to
            predict the random choices to construct a bad case.
          </li>
          <li>
            <strong className="text-ink-primary">Median-of-three</strong> (first, middle, last —
            take the median): cheap to compute and reliably avoids the sorted-input worst case
            without the overhead of finding a true median.
          </li>
        </ul>
        <p>
          None of these strategies change the average-case complexity — they only change how
          likely you are to hit the worst case in practice.
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
                <td className="px-4 py-3 text-ink-secondary">Best (balanced partitions)</td>
                <td className="px-4 py-3 font-mono text-primary">O(n log n)</td>
                <td className="px-4 py-3 font-mono text-primary">O(log n)</td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-ink-secondary">Average</td>
                <td className="px-4 py-3 font-mono text-primary">O(n log n)</td>
                <td className="px-4 py-3 font-mono text-primary">O(log n)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-secondary">Worst (already/reverse sorted, poor pivot)</td>
                <td className="px-4 py-3 font-mono text-primary">O(n²)</td>
                <td className="px-4 py-3 font-mono text-primary">O(n)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Space complexity here is recursion-stack depth, not auxiliary storage — the partition
          step rearranges elements in place. Balanced partitions give O(log n) stack depth; the
          fully unbalanced worst case gives O(n) depth, one stack frame per element.
        </p>
      </ContentSection>

      <ContentSection heading="Quicksort vs. merge sort">
        <p>
          Both are O(n log n) on average with the same divide-and-conquer shape, but they trade off
          differently:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Worst case:</strong> merge sort guarantees
            O(n log n) always; quicksort can degrade to O(n²) on bad input or bad pivot choice.
          </li>
          <li>
            <strong className="text-ink-primary">Space:</strong> quicksort sorts in place with
            O(log n) auxiliary space (call stack only); merge sort needs O(n) auxiliary space for
            the merge step.
          </li>
          <li>
            <strong className="text-ink-primary">Practice:</strong> quicksort is usually faster in
            practice due to better cache locality and lower constant factors, which is why it&rsquo;s
            the default in many standard library sort implementations — with safeguards like
            random or median-of-three pivots to avoid the worst case.
          </li>
        </ul>
      </ContentSection>

      <ContentSection heading="Worked example">
        <p>
          Sorting <code className="font-mono text-sm text-ink-primary">[10, 7, 8, 9, 1, 5]</code>{" "}
          with the last element as pivot:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Partition [10, 7, 8, 9, 1, 5], pivot = 5:</strong>{" "}
            elements less than 5 → just [1]. Result: [1, 5, 8, 9, 10, 7], pivot 5 now at index 1.
          </li>
          <li>
            <strong className="text-ink-primary">Left of pivot:</strong> [1] — already sorted
            (base case).
          </li>
          <li>
            <strong className="text-ink-primary">Right of pivot, partition [8, 9, 10, 7], pivot = 7:</strong>{" "}
            nothing is less than 7. Result: [7, 9, 10, 8], pivot 7 now at index 0 of this sub-range.
          </li>
          <li>
            <strong className="text-ink-primary">Right of that pivot, partition [9, 10, 8], pivot = 8:</strong>{" "}
            nothing less than 8. Result: [8, 10, 9], pivot 8 placed, recurse on [10, 9] → [9, 10].
          </li>
          <li>
            <strong className="text-ink-primary">Final result:</strong>{" "}
            [1, 5, 7, 8, 9, 10]
          </li>
        </ul>
      </ContentSection>

      <ContentSection heading="Related pages">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
              Big-O Cheat Sheet
            </Link>{" "}
            — see where O(n log n) and O(n²) rank among the other complexity classes.
          </li>
          <li>
            <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
              How to Analyze Time Complexity of Any Algorithm
            </Link>{" "}
            — the general method behind the average/worst-case reasoning above.
          </li>
          <li>
            <Link href="/guides/space-complexity-explained" className="text-primary hover:underline">
              Space Complexity Explained
            </Link>{" "}
            — more on why quicksort&rsquo;s recursion stack costs O(log n) to O(n).
          </li>
          <li>
            <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
              Merge Sort
            </Link>{" "}
            — the guaranteed-O(n log n) alternative, at the cost of O(n) auxiliary space.
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
