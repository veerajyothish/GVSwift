import type { MetadataRoute } from "next";

const BASE_URL = "https://gvswift.vercel.app";

const staticRoutes = [
  "/",
  "/products",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/shipping",
  "/returns",
  "/support",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route === "/" ? "" : route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}
