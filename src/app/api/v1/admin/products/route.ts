/**
 * GET /api/v1/admin/products
 * POST /api/v1/admin/products
 *
 * Admin product CRUD endpoints. Requires ADMIN role.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { listProducts, invalidateProductCache } from "@/features/catalog/repository";
import { adminCreateProduct } from "@/features/catalog/service";
import { toSafeError } from "@/lib/errors";
import { logAuditEvent } from "@/features/admin/audit-log";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const search = searchParams.get("search") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const shopId = searchParams.get("shopId") ?? undefined;

    const result = await listProducts({
      page,
      limit,
      search,
      categoryId,
      shopId,
      includeInactive: true, // Admin sees everything
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Critical security check: max 8 images per product
    if (body.images && Array.isArray(body.images) && body.images.length > 8) {
      return NextResponse.json(
        { error: "A product can have a maximum of 8 images.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Critical security check: alt text is required per image
    if (body.images && Array.isArray(body.images)) {
      for (const img of body.images) {
        if (!img.altText || typeof img.altText !== "string" || img.altText.trim() === "") {
          return NextResponse.json(
            { error: "Alt text is required for every uploaded image.", code: "VALIDATION_ERROR" },
            { status: 400 }
          );
        }
      }
    }

    const product = await adminCreateProduct(body);
    if (product) {
      await invalidateProductCache(product.slug);
      logAuditEvent({
        actorId: user?.id ?? "",
        action: "PRODUCT_CREATE",
        targetType: "PRODUCT",
        targetId: product.id,
        details: {
          name: product.name,
          slug: product.slug,
        },
      });
      revalidatePath("/admin/products");
      revalidatePath("/products");
      revalidatePath(`/products/${product.slug}`);
      if (product.shopId) {
        revalidatePath(`/shops/${product.shopId}`);
      }
      revalidatePath("/");
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
