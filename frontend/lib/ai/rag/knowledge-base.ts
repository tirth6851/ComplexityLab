/**
 * Static knowledge base for in-process RAG retrieval.
 * Chunks are matched against user queries via keyword overlap and injected
 * into the chat system prompt for richer, more grounded responses.
 */

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  /** Lowercase keywords used for retrieval scoring. */
  tags: string[];
}

export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "big-o-overview",
    title: "Big-O Notation",
    tags: ["big-o", "notation", "complexity", "asymptotic", "growth", "o(n)", "o(1)", "upper bound"],
    content:
      "Big-O notation is an upper bound on algorithm growth rate as n → ∞. Drop constants and lower-order terms: O(3n² + 2n) → O(n²). Common classes by speed: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!).",
  },
  {
    id: "constant-time",
    title: "O(1) — Constant Time",
    tags: ["o(1)", "constant", "hash", "hashmap", "hashset", "array index", "lookup"],
    content:
      "O(1) means execution time is independent of n. Examples: array index access (arr[i]), hash map get/put (average case), stack push/pop, deque operations, mathematical formula evaluation.",
  },
  {
    id: "logarithmic",
    title: "O(log n) — Logarithmic",
    tags: ["o(log n)", "logarithmic", "binary search", "binary", "bst", "tree", "divide", "halving"],
    content:
      "O(log n) algorithms halve the search space each step. Examples: binary search (sorted array), BST lookup/insert (balanced), heap push/pop, binary indexed tree, segment tree query. Base of logarithm doesn't matter for Big-O.",
  },
  {
    id: "linear",
    title: "O(n) — Linear",
    tags: ["o(n)", "linear", "single pass", "scan", "loop", "traversal", "search"],
    content:
      "O(n) requires one pass through the input. Examples: linear search, counting occurrences, summing an array, reading all elements, single for-loop over n items. Common in streaming algorithms where each element is processed once.",
  },
  {
    id: "linearithmic",
    title: "O(n log n) — Linearithmic",
    tags: ["o(n log n)", "linearithmic", "sort", "merge sort", "heap sort", "quicksort", "nlogn", "sorting"],
    content:
      "O(n log n) is optimal for comparison-based sorting. Examples: merge sort (guaranteed), heap sort (guaranteed), quicksort (average), Tim sort (Python/Java built-in). Arises when n elements each require O(log n) work.",
  },
  {
    id: "quadratic",
    title: "O(n²) — Quadratic",
    tags: ["o(n²)", "o(n^2)", "quadratic", "nested", "bubble sort", "selection sort", "insertion sort", "pair"],
    content:
      "O(n²) results from nested loops over n elements. Examples: bubble sort, selection sort, insertion sort (worst case), naive duplicate detection, checking all pairs. Acceptable for n ≤ 1,000; avoid for large datasets.",
  },
  {
    id: "exponential",
    title: "O(2ⁿ) — Exponential",
    tags: ["o(2^n)", "exponential", "fibonacci", "subset", "power set", "recursion", "backtracking", "brute force"],
    content:
      "O(2ⁿ) enumerates all subsets or branches. Examples: naive Fibonacci (overlapping recursion without memoization), power set generation, subset sum brute force. Memoization or DP collapses overlapping subproblems to O(n) or O(n²).",
  },
  {
    id: "space-complexity",
    title: "Space Complexity",
    tags: ["space", "memory", "auxiliary", "in-place", "stack", "heap", "recursive", "stack frame"],
    content:
      "Space complexity counts auxiliary memory (excluding input). O(1) extra = in-place. Call stack adds O(depth): DFS on a balanced tree is O(log n); on a path graph it's O(n). Iterative loops avoid stack growth. Space–time tradeoffs: caching/memoization spends O(n) space to cut time.",
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    tags: ["dp", "dynamic programming", "memoization", "tabulation", "optimal substructure", "overlapping", "knapsack"],
    content:
      "DP applies when a problem has optimal substructure and overlapping subproblems. Two approaches: (1) top-down memoization — recursive + cache, O(states × transition); (2) bottom-up tabulation — iterative fill. Classic examples: Fibonacci O(n), longest common subsequence O(n·m), knapsack O(n·W), coin change O(n·amount).",
  },
  {
    id: "graph-traversal",
    title: "Graph Traversal — BFS & DFS",
    tags: ["bfs", "dfs", "graph", "breadth first", "depth first", "traversal", "visited", "queue"],
    content:
      "BFS and DFS both run in O(V + E) for adjacency-list graphs (V vertices, E edges). BFS uses a queue; finds shortest path in unweighted graphs. DFS uses a stack (or recursion); useful for cycle detection, topological sort, SCC. Space: BFS O(V) for the queue; DFS O(V) for the recursion stack (worst: path graph).",
  },
  {
    id: "amortized",
    title: "Amortized Analysis",
    tags: ["amortized", "amortize", "aggregate", "dynamic array", "append", "push", "table doubling"],
    content:
      "Amortized analysis averages cost over a sequence of operations. Dynamic array append: individual resize is O(n) but amortized O(1) per append because doubling halves resize frequency. Useful for: splay trees, union-find, hash table rehashing. Methods: aggregate, accounting (tokens), potential (Φ function).",
  },
  {
    id: "master-theorem",
    title: "Master Theorem for Recurrences",
    tags: ["master theorem", "recurrence", "divide and conquer", "t(n)", "binary search recurrence"],
    content:
      "For T(n) = a·T(n/b) + O(nᶜ): compare c to log_b(a). If c < log_b(a): T(n) = O(n^log_b(a)). If c = log_b(a): T(n) = O(nᶜ log n). If c > log_b(a): T(n) = O(nᶜ). Examples: merge sort T(n)=2T(n/2)+O(n) → O(n log n); binary search T(n)=T(n/2)+O(1) → O(log n).",
  },
  {
    id: "two-pointers",
    title: "Two-Pointer & Sliding Window",
    tags: ["two pointer", "two pointers", "sliding window", "window", "subarr", "subarray", "contiguous"],
    content:
      "Two-pointer technique solves problems on sorted arrays or linked lists in O(n) instead of O(n²). Sliding window maintains a window of elements meeting a constraint; expand right pointer, shrink left pointer when violated. Examples: two-sum (sorted), remove duplicates, longest substring without repeats.",
  },
  {
    id: "heap-priority-queue",
    title: "Heap / Priority Queue",
    tags: ["heap", "priority queue", "min heap", "max heap", "heapify", "top-k", "kth largest"],
    content:
      "Binary heap: insert O(log n), extract-min/max O(log n), peek O(1), build-heap O(n). Use cases: top-K elements in O(n log K), Dijkstra's shortest path O((V+E) log V), Huffman coding, continuous median (two heaps). Python: heapq (min-heap); Java: PriorityQueue.",
  },
  {
    id: "hash-table-internals",
    title: "Hash Table Internals",
    tags: ["hash table", "hash map", "collision", "chaining", "open addressing", "load factor", "rehash"],
    content:
      "Hash tables achieve O(1) average for get/put via a hash function mapping keys to buckets. Collision resolution: separate chaining (linked lists) or open addressing (linear probing). Load factor λ = n/m; rehash when λ > 0.7. Worst-case O(n) if all keys collide. Python dict, Java HashMap, JavaScript object use hash tables.",
  },
  {
    id: "recursion-vs-iteration",
    title: "Recursion vs Iteration",
    tags: ["recursion", "recursive", "iterative", "tail call", "stack overflow", "base case"],
    content:
      "Recursive and iterative solutions have the same time complexity but differ in space: recursion adds O(depth) stack frames. Tail-recursive functions can be optimized to O(1) space in some languages. Convert deep recursion to explicit stack to avoid stack overflow. Every recursive algorithm has an iterative equivalent.",
  },
];
