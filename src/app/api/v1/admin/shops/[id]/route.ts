import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { adminUpdateShop } from "@/features/catalog/service";
import { toSafeError } from "@/lib/errors";
import { logAuditEvent } from "@/features/admin/audit-log";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const shop = await adminUpdateShop(id, body);

    logAuditEvent({
      actorId: user?.id ?? "",
      action: "SHOP_UPDATE",
      targetType: "SHOP",
      targetId: shop.id,
      details: {
        name: shop.name,
        slug: shop.slug,
      },
    });

    return NextResponse.json(shop, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
