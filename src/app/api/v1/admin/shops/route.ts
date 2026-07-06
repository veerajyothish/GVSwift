import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { listShops } from "@/features/catalog/repository";
import { adminCreateShop } from "@/features/catalog/service";
import { toSafeError } from "@/lib/errors";
import { logAuditEvent } from "@/features/admin/audit-log";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const featuredOnly = searchParams.get("featured") === "true";

    const params: { isActive?: boolean; isFeatured?: boolean } = {};
    if (searchParams.has("active")) {
      params.isActive = activeOnly;
    }
    if (searchParams.has("featured")) {
      params.isFeatured = featuredOnly;
    }

    const shops = await listShops(params);
    return NextResponse.json(shops, { status: 200 });
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

    const shop = await adminCreateShop(body);

    logAuditEvent({
      actorId: user?.id ?? "",
      action: "SHOP_CREATE",
      targetType: "SHOP",
      targetId: shop.id,
      details: {
        name: shop.name,
        slug: shop.slug,
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
