/**
 * Search abstraction for the catalog domain.
 *
 * All product search logic is encapsulated here so that route handlers
 * and UI components never contain inline search queries. This makes it
 * trivial to swap Postgres ILIKE for a dedicated search engine
 * (e.g., Typesense, Meilisearch, Algolia) later without touching callers.
 *
 * @see TICKET-105, Technical Architecture Document §7
 */

import { AppError } from "@/lib/errors";
import { z } from "zod";
import * as repository from "./repository";
import type { PaginatedProductsResult } from "./types";

/* ── Validation ────────────────────────────────────────────────────────── */

const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query too long"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export type SearchParams = z.input<typeof SearchQuerySchema>;
export type ValidatedSearchParams = z.output<typeof SearchQuerySchema>;

/* ── Public API ────────────────────────────────────────────────────────── */

/**
 * Searches products by name and description using Postgres ILIKE.
 *
 * The underlying implementation currently delegates to the existing
 * `listProducts` repository function with a `search` param, which
 * performs case-insensitive `contains` matches via Prisma. When the
 * project migrates to a dedicated search engine, only this function
 * needs to change — callers are unaffected.
 */
export async function searchProducts(
  params: SearchParams
): Promise<PaginatedProductsResult> {
  const parsed = SearchQuerySchema.safeParse(params);

  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid search parameters",
      400
    );
  }

  const { query, page, limit, categoryId } = parsed.data;

  return repository.listProducts({
    search: query,
    page,
    limit,
    categoryId,
  });
}

/**
 * Sanitises and normalises a raw user search string for safe use.
 * Trims whitespace and collapses multiple spaces. This is intended
 * for use on the client side before navigating, and on the server
 * side before calling `searchProducts`.
 */
export function normaliseSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 100);
}
