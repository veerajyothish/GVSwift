/**
 * cached-queries.ts
 *
 * Cached wrappers around the read-only Prisma repository functions.
 * Uses Next.js `unstable_cache` for 60-second server-side memoisation.
 *
 * WHY A SEPARATE FILE:
 * - repository.ts also contains write functions (createProduct, updateProduct, etc.)
 *   which must NEVER be cached.
 * - Keeping cached reads here makes cache invalidation explicit and safe.
 *
 * CACHE STRATEGY:
 * - Products: 60s revalidation — inventory/price can change, we don't want stale data
 * - Categories: 300s (5 min) — categories rarely change
 * - Tags allow surgical invalidation from server actions when admin mutates data
 */

import { unstable_cache } from "next/cache";
import * as repo from "./repository";
import type { ListProductsParams } from "./types";

/* ── Product listing — 5 minute cache ──────────────────────────────────────── */
export const getCachedProducts = (params: ListProductsParams) =>
  unstable_cache(
    async () => repo.listProducts(params, true),
    ["catalog-products", JSON.stringify(params)],
    {
      revalidate: 300,
      tags: ["products"],
    }
  )();

/* ── Product detail by slug — 5 minute cache ───────────────────────────────── */
export const getCachedProductBySlug = unstable_cache(
  async (slug: string) => {
    return repo.getProductBySlug(slug, false, true);
  },
  ["catalog-product-slug"],
  {
    revalidate: 300,
    tags: ["products"],
  }
);

/* ── Related products — 5 minute cache ─────────────────────────────────────── */
export const getCachedRelatedProducts = unstable_cache(
  async (categoryId: string, excludeProductId: string, limit = 4) => {
    return repo.getRelatedProducts(categoryId, excludeProductId, limit);
  },
  ["catalog-related"],
  {
    revalidate: 300,
    tags: ["products"],
  }
);

/* ── Categories — 10 minute cache (rarely change) ──────────────────────────── */
export const getCachedCategories = unstable_cache(
  async () => {
    return repo.listCategories(true);
  },
  ["catalog-categories"],
  {
    revalidate: 600,
    tags: ["categories"],
  }
);