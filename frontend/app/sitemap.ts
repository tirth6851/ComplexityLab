import type { MetadataRoute } from "next";

const BASE_URL = "https://www.complexitylab.top";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/complexity-cheatsheet", changeFrequency: "monthly", priority: 0.8 },
    { path: "/guides/how-to-analyze-time-complexity", changeFrequency: "monthly", priority: 0.8 },
    { path: "/algorithms/binary-search", changeFrequency: "monthly", priority: 0.7 },
    { path: "/algorithms/merge-sort", changeFrequency: "monthly", priority: 0.7 },
    { path: "/algorithms/quicksort", changeFrequency: "monthly", priority: 0.7 },
    { path: "/guides/space-complexity-explained", changeFrequency: "monthly", priority: 0.8 },
    { path: "/guides/big-o-vs-big-theta-vs-big-omega", changeFrequency: "monthly", priority: 0.8 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
    { path: "/changelog", changeFrequency: "weekly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
