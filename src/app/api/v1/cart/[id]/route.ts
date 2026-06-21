/**
 * PUT /api/v1/cart/[id]
 * DELETE /api/v1/cart/[id]
 *
 * Manage individual cart items. Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { updateCartItemQuantity, removeFromCart } from "@/features/cart/service";
import { toSafeError } from "@/lib/errors";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { quantity } = body;
    if (typeof quantity !== "number") {
      return NextResponse.json(
        { error: "quantity (number) is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await updateCartItemQuantity(user.id, id, quantity);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await removeFromCart(user.id, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
