/**
 * cached-queries.ts — Replaced unstable_cache with Upstash Redis client delegates
 */

import * as repo from "./repository";
import type { ListProductsParams } from "./types";

export const getCachedProducts = async (params: ListProductsParams) => {
  return repo.getCachedProducts(params);
};

export const getCachedProductBySlug = async (slug: string) => {
  return repo.getProductBySlug(slug);
};

export const getCachedRelatedProducts = async (categoryId: string, excludeProductId: string, limit = 4) => {
  return repo.getRelatedProducts(categoryId, excludeProductId, limit);
};

export const getCachedCategories = async () => {
  return repo.getCollections();
};