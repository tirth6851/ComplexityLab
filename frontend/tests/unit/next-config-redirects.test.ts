import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

/**
 * Guards the domain-consolidation redirects in next.config.ts: every legacy
 * host (the bare apex + the old default Vercel aliases) must permanently
 * redirect to the canonical www.complexitylab.top, and PR preview hosts must
 * never be swept up by the same rule.
 */
describe("next.config.ts redirects", () => {
  it("redirects every legacy host to the canonical domain, path and query preserved", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toBeDefined();
    expect(redirects!.length).toBeGreaterThan(0);

    for (const rule of redirects!) {
      expect(rule.source).toBe("/:path*");
      expect(rule.destination).toBe("https://www.complexitylab.top/:path*");
      expect(rule.permanent).toBe(true); // 308 — this is a permanent canonicalization
      expect(rule.has).toHaveLength(1);
      expect(rule.has![0]).toMatchObject({ type: "host" });
    }
  });

  it("covers the bare apex domain and every known production Vercel alias", async () => {
    const redirects = await nextConfig.redirects?.();
    const hosts = redirects!.map((r) => (r.has![0] as { value: string }).value);

    expect(hosts).toContain("complexitylab.top");
    expect(hosts).toContain("complexity-lab-eight.vercel.app");
    expect(hosts).toContain("complexity-lab-tirths-projects-de842079.vercel.app");
    expect(hosts).toContain("complexity-lab-git-main-tirths-projects-de842079.vercel.app");
  });

  it("never redirects the canonical host itself or PR preview hosts", async () => {
    const redirects = await nextConfig.redirects?.();
    const hosts = redirects!.map((r) => (r.has![0] as { value: string }).value);

    // The canonical host must not redirect to itself (infinite loop).
    expect(hosts).not.toContain("www.complexitylab.top");
    // Preview deployments (per-branch/per-PR) must stay independently
    // reachable for review — this is a representative example, not
    // enumerable, so just confirm the list is the known fixed set above.
    expect(hosts).not.toContain(
      "complexity-lab-git-docs-readme-082457-tirths-projects-de842079.vercel.app",
    );
    expect(hosts).toHaveLength(4);
  });
});
