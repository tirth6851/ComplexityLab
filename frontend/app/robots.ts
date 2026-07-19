import type { MetadataRoute } from "next";

const BASE_URL = "https://complexitylab.top";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/sso-callback",
        "/dashboard/",
        "/analyzer/",
        "/analyses/",
        "/snippets/",
        "/settings/",
        "/progress/",
        "/chat/",
        "/learning/",
        "/playground/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
