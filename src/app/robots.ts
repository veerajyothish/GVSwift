import type { MetadataRoute } from "next";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/api", "/checkout"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
