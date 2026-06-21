/**
 * GET /api/v1/cart
 * POST /api/v1/cart
 * DELETE /api/v1/cart (clear cart)
 *
 * User cart management endpoints. Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { getCart, addToCart, clearCart } from "@/features/cart/service";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const cart = await getCart(user.id);
    return NextResponse.json(cart || { items: [] }, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = body;
    if (!productId || !variantId || typeof quantity !== "number") {
      return NextResponse.json(
        { error: "productId, variantId, and quantity (number) are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const item = await addToCart(user.id, productId, variantId, quantity);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    await clearCart(user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
