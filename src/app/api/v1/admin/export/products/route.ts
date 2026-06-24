import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { toSafeError } from "@/lib/errors";

export async function GET() {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const products = await prisma.product.findMany({
      take: 10000,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: true,
        reviews: true,
      },
    });

    const mapped = products.map((p) => {
      const avgRating = p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : 0;

      return {
        "Product ID": p.id,
        "Name": p.name,
        "Slug": p.slug,
        "Category": p.category?.name ?? "",
        "Variants Count": p.variants.length,
        "Total Stock": p.variants.reduce((sum, v) => sum + v.stock, 0),
        "Average Rating": avgRating.toFixed(2),
        "Total Reviews": p.reviews.length,
        "Created Date": p.createdAt.toISOString(),
      };
    });

    return NextResponse.json(mapped);
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
