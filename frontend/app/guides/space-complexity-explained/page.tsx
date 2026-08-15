import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, CodeBlock } from "@/components/content/content-page";

export const metadata: Metadata = {
  title: "Space Complexity Explained: Auxiliary Space vs. Input Space",
  description:
    "What space complexity actually measures, the difference between auxiliary space and input space, why recursion costs stack space, and the mistakes learners make when analyzing it.",
  alternates: { canonical: "/guides/space-complexity-explained" },
  openGraph: {
    title: "Space Complexity Explained: Auxiliary Space vs. Input Space",
    description:
      "What space complexity actually measures, the difference between auxiliary space and input space, and why recursion costs stack space.",
    url: "/guides/space-complexity-explained",
    // "article" is the only OpenGraph type the Metadata type allows modifiedTime on.
    type: "article",
    modifiedTime: "2026-07-25",
  },
};

export default function SpaceComplexityGuide() {
  return (
    <ContentPage
      eyebrow="Guide"
      title="Space Complexity Explained"
      dek="Time complexity asks how many operations an algorithm does. Space complexity asks how much memory it needs while doing them — and the two are analyzed with the same Big-O tools."
      lastUpdated="2026-07-25"
    >
      <ContentSection heading="What space complexity measures">
        <p>
          Space complexity is the amount of memory an algorithm uses, expressed as a function of
          input size n, using the same Big-O notation as time complexity. An algorithm that
          allocates a new array of size n has O(n) space complexity; one that only ever uses a
          fixed number of variables, regardless of n, has O(1) space complexity.
        </p>
        <p>
          See the{" "}
          <Link href="/complexity-cheatsheet" className="text-primary hover:underline">
            Big-O Cheat Sheet
          </Link>{" "}
          for the same complexity classes applied to space instead of time — the growth-rate
          reasoning is identical.
        </p>
      </ContentSection>

      <ContentSection heading="Auxiliary space vs. input space">
        <p>
          This is the distinction that trips up most learners. <strong className="text-ink-primary">
          Input space</strong> is the memory used to store the input itself — you don&rsquo;t get
          to opt out of it, and it&rsquo;s not really &ldquo;used&rdquo; by the algorithm&rsquo;s logic.{" "}
          <strong className="text-ink-primary">Auxiliary space</strong> is everything else the
          algorithm allocates <em>beyond</em> the input to do its work — temporary arrays, extra
          variables, a recursion call stack.
        </p>
        <p>
          When people say an algorithm sorts &ldquo;in place&rdquo; with O(1) space, they mean
          O(1) <em>auxiliary</em> space — the input array itself still occupies O(n), but the
          algorithm doesn&rsquo;t allocate anything new beyond it. Space complexity discussions
          almost always mean auxiliary space unless stated otherwise; this guide does the same
          from here on.
        </p>
        <CodeBlock>{`function reverseInPlace(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }
  return nums;
}
// Auxiliary space: O(1) — only left, right, and a swap use extra memory
// (the input array itself is O(n), but that's input space, not auxiliary space)`}</CodeBlock>
      </ContentSection>

      <ContentSection heading="Arrays: when you allocate new memory">
        <p>
          Compare the in-place reversal above to a version that builds a new array instead of
          mutating the input:
        </p>
        <CodeBlock>{`function reverseCopy(nums) {
  const result = [];
  for (let i = nums.length - 1; i >= 0; i--) {
    result.push(nums[i]);
  }
  return result;
}
// Auxiliary space: O(n) — result grows to hold all n elements`}</CodeBlock>
        <p>
          Same time complexity — O(n) either way — but very different space complexity. This is a
          real, common tradeoff: the copying version is safer (it doesn&rsquo;t mutate the
          caller&rsquo;s data) at the cost of O(n) extra memory.
        </p>
      </ContentSection>

      <ContentSection heading="Recursion stack space">
        <p>
          Every recursive call adds a new frame to the call stack, and each frame consumes memory
          until it returns. That makes the recursion&rsquo;s <em>depth</em> — not the number of
          calls — the relevant quantity for space complexity.
        </p>
        <CodeBlock>{`function sum(nums, i = 0) {
  if (i >= nums.length) return 0;
  return nums[i] + sum(nums, i + 1);
}
// n recursive calls, and they're all on the stack simultaneously
// (the outermost call can't return until the innermost one does)
// Auxiliary space: O(n) — one stack frame per element, all live at once`}</CodeBlock>
        <p>
          This is why an iterative version of the same function has O(1) auxiliary space even
          though the recursive version doing the &ldquo;same&rdquo; logic is O(n) — the loop reuses one set
          of variables instead of stacking a new frame per iteration.
        </p>
        <p>
          Divide-and-conquer recursion that halves its input each call — like{" "}
          <Link href="/algorithms/binary-search" className="text-primary hover:underline">
            binary search
          </Link>
          &rsquo;s recursive form — only ever has O(log n) frames on the stack at once, because the
          recursion depth is the number of halvings, not the number of elements.
        </p>
      </ContentSection>

      <ContentSection heading="In-place algorithms: how low auxiliary space is achieved">
        <p>
          &ldquo;In-place&rdquo; means the algorithm rearranges the input using only a constant
          amount of extra memory, rather than building new data structures. This is a real
          tradeoff between sorting algorithms:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/algorithms/quicksort" className="text-primary hover:underline">
              Quicksort
            </Link>{" "}
            partitions the input array in place, so its auxiliary space is just the recursion
            stack — O(log n) on average, O(n) in the worst case.
          </li>
          <li>
            <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
              Merge sort
            </Link>{" "}
            is <em>not</em> in place — its merge step builds new arrays to hold merged results,
            costing O(n) auxiliary space regardless of how balanced the recursion is.
          </li>
        </ul>
        <p>
          Neither approach is universally &ldquo;better&rdquo; — merge sort trades memory for a
          time-complexity guarantee that never degrades, while quicksort trades a worst-case risk
          for lower memory use in the common case.
        </p>
      </ContentSection>

      <ContentSection heading="Common mistakes learners make">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink-primary">Counting input space as if it were
            auxiliary space.</strong> Every algorithm that touches an n-element array &ldquo;uses&rdquo;
            O(n) memory in some sense — but calling every such algorithm O(n) space erases the
            distinction that actually matters: what the algorithm allocates <em>beyond</em> the
            input.
          </li>
          <li>
            <strong className="text-ink-primary">Forgetting the recursion stack entirely.</strong>{" "}
            It&rsquo;s easy to see a recursive function that returns a single number and assume
            O(1) space, missing that the stack itself grows with recursion depth.
          </li>
          <li>
            <strong className="text-ink-primary">Assuming lower time complexity implies lower
            space complexity, or vice versa.</strong> They&rsquo;re independent axes — merge
            sort&rsquo;s better worst-case time complexity comes with worse space complexity than
            quicksort&rsquo;s, not better.
          </li>
          <li>
            <strong className="text-ink-primary">Ignoring output space.</strong> If a function is
            required to return a new n-element structure, that memory is arguably unavoidable
            output — worth naming explicitly (e.g. &ldquo;O(n) auxiliary space excluding the required
            output&rdquo;) rather than folding it silently into &ldquo;O(1) space.&rdquo;
          </li>
        </ul>
      </ContentSection>

      <ContentSection heading="Related pages">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/guides/how-to-analyze-time-complexity" className="text-primary hover:underline">
              How to Analyze Time Complexity of Any Algorithm
            </Link>{" "}
            — the equivalent step-by-step method for time, including the loop/recursion patterns
            referenced above.
          </li>
          <li>
            <Link href="/algorithms/binary-search" className="text-primary hover:underline">
              Binary Search
            </Link>{" "}
            — O(1) iterative vs. O(log n) recursive space, a direct example of the recursion-stack
            point above.
          </li>
          <li>
            <Link href="/algorithms/merge-sort" className="text-primary hover:underline">
              Merge Sort
            </Link>{" "}
            — O(n) auxiliary space from the merge step, not in place.
          </li>
          <li>
            <Link href="/algorithms/quicksort" className="text-primary hover:underline">
              Quicksort
            </Link>{" "}
            — in-place partitioning, O(log n) to O(n) space depending on pivot luck.
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
