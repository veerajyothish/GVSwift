import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const BASE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/account/", "/checkout/", "/auth/", "/api/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
