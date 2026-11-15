import type { NextConfig } from "next";

/**
 * Every other host this deployment answers on, permanently redirected to the
 * canonical production domain (matches metadataBase/sitemap.ts/robots.ts,
 * which have used www.complexitylab.top as the canonical host since the
 * "use www.complexitylab.top as canonical host, not apex" SEO fix). This
 * consolidates search ranking, old bookmarks, and old shared links onto one
 * URL — Vercel's own dashboard domain-redirect setting isn't reachable from
 * here, so this does the equivalent at the app layer instead.
 *
 * Deliberately NOT listed: per-PR preview hosts (*.vercel.app branch/preview
 * deployments) — those must stay independently reachable for review.
 */
const LEGACY_HOSTS = [
  "complexitylab.top", // bare apex — www is canonical
  "complexity-lab-eight.vercel.app", // original default Vercel alias
  "complexity-lab-tirths-projects-de842079.vercel.app", // team default alias
  "complexity-lab-git-main-tirths-projects-de842079.vercel.app", // main-branch alias
];

const nextConfig: NextConfig = {
  // Vercel-ready by default; no custom config required for deployment.
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.56.1"],
  async redirects() {
    return LEGACY_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://www.complexitylab.top/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
