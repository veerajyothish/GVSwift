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
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if ids query param is present
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: ids } },
          include: {
            images: {
              orderBy: [
                { isPrimary: "desc" },
                { sortOrder: "asc" },
              ],
            },
            variants: true,
          },
        });

        // Fetch aggregate rating for these products
        const ratingAggregates = await prisma.productReview.groupBy({
          by: ["productId"],
          where: { productId: { in: products.map(p => p.id) } },
          _avg: { rating: true },
        });

        const productsWithRatings = products.map((product) => {
          const match = ratingAggregates.find((r) => r.productId === product.id);
          return {
            ...product,
            avgRating: match?._avg.rating ?? null,
          };
        });

        return NextResponse.json({ products: productsWithRatings }, { status: 200 });
      }
    }

    const query = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const result = await getProducts(query);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
