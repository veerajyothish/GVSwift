import type { MetadataRoute } from "next";

const BASE_URL = "https://gvswift.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/account/", "/api/", "/checkout/", "/auth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
