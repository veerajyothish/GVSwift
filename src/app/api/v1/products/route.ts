/**
 * GET /api/v1/products
 *
 * Returns a paginated list of active products, optionally filtered by category.
 *
 * Query parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 20)
 *   - categoryId: UUID (optional)
 *   - search: string (optional)
 *
 * Response: 200 { products: [], totalCount, page, limit, totalPages } | 400 { error, code }
 */

import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/features/catalog/service";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const result = await getProducts(query);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
