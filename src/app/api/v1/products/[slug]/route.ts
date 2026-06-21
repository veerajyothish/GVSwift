/**
 * GET /api/v1/products/[slug]
 *
 * Returns detail for a single product by its slug.
 *
 * Response: 200 { product } | 404 { error, code } | 400 { error, code }
 */

import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/features/catalog/service";
import { toSafeError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
