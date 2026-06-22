import type { MetadataRoute } from "next";

const staticRoutes = [
  "",
  "/products",
  "/support",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping",
  "/cookies",
  "/disclaimer",
  "/faq",
  "/grievance",
];

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app").replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const baseUrl = siteUrl();

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/products" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/products" ? 0.9 : 0.6,
  }));
}
