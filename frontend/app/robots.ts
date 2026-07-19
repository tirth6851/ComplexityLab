import type { MetadataRoute } from "next";

const BASE_URL = "https://complexitylab.top";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/analyzer/", "/analyses/", "/snippets/", "/settings/", "/sso-callback"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
