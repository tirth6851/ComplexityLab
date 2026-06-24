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
 * Every language has 4–5 samples covering O(log n) → O(n) → O(n log n) → O(n²) → O(2ⁿ).
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
      id: "ts-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const out: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    out.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return out.concat(left.slice(i)).concat(right.slice(j));
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
      id: "js-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `function binarySearch(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
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
      id: "js-matrix-multiply",
      name: "Matrix multiply (naïve)",
      expectedTime: "O(n³)",
      code: `function matMul(A, B) {
  const n = A.length;
  const C = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < n; j++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
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
    {
      id: "py-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]
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
      id: "py-fib-naive",
      name: "Fibonacci (naive recursion)",
      expectedTime: "O(2ⁿ)",
      code: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
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
      id: "java-frequency",
      name: "Frequency count (HashMap)",
      expectedTime: "O(n)",
      code: `import java.util.HashMap;
import java.util.Map;

public class Counter {
    public static Map<Integer, Integer> frequency(int[] nums) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int n : nums) {
            counts.merge(n, 1, Integer::sum);
        }
        return counts;
    }
}
`,
    },
    {
      id: "java-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `public class Sorter {
    public static int[] mergeSort(int[] arr) {
        if (arr.length <= 1) return arr;
        int mid = arr.length / 2;
        int[] left = mergeSort(java.util.Arrays.copyOfRange(arr, 0, mid));
        int[] right = mergeSort(java.util.Arrays.copyOfRange(arr, mid, arr.length));
        return merge(left, right);
    }

    private static int[] merge(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) {
            out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
        }
        while (i < a.length) { out[k++] = a[i++]; }
        while (j < b.length) { out[k++] = b[j++]; }
        return out;
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
    {
      id: "java-fib-naive",
      name: "Fibonacci (naive recursion)",
      expectedTime: "O(2ⁿ)",
      code: `public class Fib {
    public static long fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}
`,
    },
  ],
  go: [
    {
      id: "go-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `package main

func binarySearch(sorted []int, target int) int {
	lo, hi := 0, len(sorted)-1
	for lo <= hi {
		mid := (lo + hi) / 2
		if sorted[mid] == target {
			return mid
		}
		if sorted[mid] < target {
			lo = mid + 1
		} else {
			hi = mid - 1
		}
	}
	return -1
}
`,
    },
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
      id: "go-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `package main

func mergeSort(arr []int) []int {
	if len(arr) <= 1 {
		return arr
	}
	mid := len(arr) / 2
	left := mergeSort(arr[:mid])
	right := mergeSort(arr[mid:])
	return merge(left, right)
}

func merge(a, b []int) []int {
	out := make([]int, 0, len(a)+len(b))
	i, j := 0, 0
	for i < len(a) && j < len(b) {
		if a[i] <= b[j] {
			out = append(out, a[i]); i++
		} else {
			out = append(out, b[j]); j++
		}
	}
	return append(append(out, a[i:]...), b[j:]...)
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
    {
      id: "go-fib-naive",
      name: "Fibonacci (naive recursion)",
      expectedTime: "O(2ⁿ)",
      code: `package main

func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}
`,
    },
  ],
  rust: [
    {
      id: "rust-binary-search",
      name: "Binary search",
      expectedTime: "O(log n)",
      code: `fn binary_search(sorted: &[i64], target: i64) -> Option<usize> {
    let mut lo = 0usize;
    let mut hi = sorted.len().saturating_sub(1);
    while lo <= hi {
        let mid = lo + (hi - lo) / 2;
        match sorted[mid].cmp(&target) {
            std::cmp::Ordering::Equal => return Some(mid),
            std::cmp::Ordering::Less => lo = mid + 1,
            std::cmp::Ordering::Greater => {
                if mid == 0 { break; }
                hi = mid - 1;
            }
        }
    }
    None
}
`,
    },
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
      id: "rust-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `fn merge_sort(arr: &mut Vec<i32>) {
    let len = arr.len();
    if len <= 1 { return; }
    let mid = len / 2;
    let mut left = arr[..mid].to_vec();
    let mut right = arr[mid..].to_vec();
    merge_sort(&mut left);
    merge_sort(&mut right);
    let (mut i, mut j, mut k) = (0, 0, 0);
    while i < left.len() && j < right.len() {
        if left[i] <= right[j] { arr[k] = left[i]; i += 1; }
        else { arr[k] = right[j]; j += 1; }
        k += 1;
    }
    while i < left.len() { arr[k] = left[i]; i += 1; k += 1; }
    while j < right.len() { arr[k] = right[j]; j += 1; k += 1; }
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
    {
      id: "rust-fib-naive",
      name: "Fibonacci (naive recursion)",
      expectedTime: "O(2ⁿ)",
      code: `fn fib(n: u32) -> u64 {
    if n <= 1 { return n as u64; }
    fib(n - 1) + fib(n - 2)
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
      id: "cpp-frequency",
      name: "Frequency count (unordered_map)",
      expectedTime: "O(n)",
      code: `#include <vector>
#include <unordered_map>

std::unordered_map<int, int> frequency(const std::vector<int>& nums) {
    std::unordered_map<int, int> counts;
    for (int n : nums) {
        counts[n]++;
    }
    return counts;
}
`,
    },
    {
      id: "cpp-merge-sort",
      name: "Merge sort",
      expectedTime: "O(n log n)",
      code: `#include <vector>

void merge(std::vector<int>& arr, int lo, int mid, int hi) {
    std::vector<int> tmp(arr.begin() + lo, arr.begin() + hi + 1);
    int i = 0, j = mid - lo + 1, k = lo;
    while (i <= mid - lo && j <= hi - lo)
        arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
    while (i <= mid - lo) arr[k++] = tmp[i++];
    while (j <= hi - lo)  arr[k++] = tmp[j++];
}

void mergeSort(std::vector<int>& arr, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    mergeSort(arr, lo, mid);
    mergeSort(arr, mid + 1, hi);
    merge(arr, lo, mid, hi);
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
    {
      id: "cpp-fib-naive",
      name: "Fibonacci (naive recursion)",
      expectedTime: "O(2ⁿ)",
      code: `long long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
`,
    },
  ],
};
