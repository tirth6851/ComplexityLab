import type { LanguageId } from "./languages";

export interface CodeSample {
  id: string;
  name: string;
  /** What the heuristic engine is expected to report (shown nowhere; used in tests). */
  expectedTime: string;
  code: string;
}

/**
 * Sample templates per language. Each is small, idiomatic, and chosen to land
 * on a distinct point of the complexity gradient so the analyzer demos well.
 */
export const SAMPLES: Record<LanguageId, CodeSample[]> = {
  typescript: [
    {
      id: "ts-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `function binarySearch(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
`,
    },
    {
      id: "ts-two-sum",
      name: "Two sum (hash map)",
      expectedTime: "O(n)",
      code: `function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const want = target - nums[i];
    const j = seen.get(want);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return null;
}
`,
    },
    {
      id: "ts-bubble-sort",
      name: "Bubble sort",
      expectedTime: "O(n²)",
      code: `function bubbleSort(values: number[]): number[] {
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values.length - i - 1; j++) {
      if (values[j] > values[j + 1]) {
        const tmp = values[j];
        values[j] = values[j + 1];
        values[j + 1] = tmp;
      }
    }
  }
  return values;
}
`,
    },
    {
      id: "ts-fib-naive",
      name: "Fibonacci (naive recursion)",
      expectedTime: "O(2ⁿ)",
      code: `function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
`,
    },
  ],
  javascript: [
    {
      id: "js-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    out.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}
`,
    },
    {
      id: "js-max",
      name: "Find max (single pass)",
      expectedTime: "O(n)",
      code: `function findMax(values) {
  let max = -Infinity;
  for (const v of values) {
    if (v > max) max = v;
  }
  return max;
}
`,
    },
    {
      id: "js-fib-memo",
      name: "Fibonacci (memoized)",
      expectedTime: "O(n)",
      code: `function fib(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}
`,
    },
  ],
  python: [
    {
      id: "py-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `def binary_search(sorted_list, target):
    lo, hi = 0, len(sorted_list) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if sorted_list[mid] == target:
            return mid
        if sorted_list[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    },
    {
      id: "py-pairs",
      name: "All pairs (nested loops)",
      expectedTime: "O(n²)",
      code: `def all_pairs(items):
    pairs = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            pairs.append((items[i], items[j]))
    return pairs
`,
    },
    {
      id: "py-counter",
      name: "Frequency count",
      expectedTime: "O(n)",
      code: `def frequency(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts
`,
    },
  ],
  java: [
    {
      id: "java-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `public class Search {
    public static int binarySearch(int[] sorted, int target) {
        int lo = 0;
        int hi = sorted.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (sorted[mid] == target) return mid;
            if (sorted[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}
`,
    },
    {
      id: "java-selection-sort",
      name: "Selection sort",
      expectedTime: "O(n²)",
      code: `public class Sorter {
    public static void selectionSort(int[] values) {
        for (int i = 0; i < values.length - 1; i++) {
            int min = i;
            for (int j = i + 1; j < values.length; j++) {
                if (values[j] < values[min]) min = j;
            }
            int tmp = values[min];
            values[min] = values[i];
            values[i] = tmp;
        }
    }
}
`,
    },
  ],
  go: [
    {
      id: "go-linear-scan",
      name: "Linear scan",
      expectedTime: "O(n)",
      code: `package main

func contains(values []int, target int) bool {
	for _, v := range values {
		if v == target {
			return true
		}
	}
	return false
}
`,
    },
    {
      id: "go-matrix",
      name: "Matrix sum (nested loops)",
      expectedTime: "O(n²)",
      code: `package main

func matrixSum(matrix [][]int) int {
	total := 0
	for i := 0; i < len(matrix); i++ {
		for j := 0; j < len(matrix[i]); j++ {
			total += matrix[i][j]
		}
	}
	return total
}
`,
    },
  ],
  rust: [
    {
      id: "rust-linear-max",
      name: "Find max (single pass)",
      expectedTime: "O(n)",
      code: `fn find_max(values: &[i64]) -> Option<i64> {
    let mut max: Option<i64> = None;
    for &v in values {
        max = match max {
            Some(m) if m >= v => Some(m),
            _ => Some(v),
        };
    }
    max
}
`,
    },
    {
      id: "rust-pairs",
      name: "All pairs (nested loops)",
      expectedTime: "O(n²)",
      code: `fn all_pairs(items: &[i32]) -> Vec<(i32, i32)> {
    let mut pairs = Vec::new();
    for i in 0..items.len() {
        for j in (i + 1)..items.len() {
            pairs.push((items[i], items[j]));
        }
    }
    pairs
}
`,
    },
  ],
  cpp: [
    {
      id: "cpp-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `#include <vector>

int binarySearch(const std::vector<int>& sorted, int target) {
    int lo = 0;
    int hi = static_cast<int>(sorted.size()) - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (sorted[mid] == target) return mid;
        if (sorted[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
`,
    },
    {
      id: "cpp-bubble-sort",
      name: "Bubble sort",
      expectedTime: "O(n²)",
      code: `#include <vector>

void bubbleSort(std::vector<int>& values) {
    for (size_t i = 0; i < values.size(); i++) {
        for (size_t j = 0; j + i + 1 < values.size(); j++) {
            if (values[j] > values[j + 1]) {
                std::swap(values[j], values[j + 1]);
            }
        }
    }
}
`,
    },
  ],
};
