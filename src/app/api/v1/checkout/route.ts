/**
 * POST /api/v1/checkout
 *
 * Checkout endpoint — creates an order from the user's cart.
 * Requires authentication. All business logic lives in features/checkout/service.ts.
 *
 * Request body (JSON):
 *   { cartId, addressId, idempotencyKey, paymentMethod: "COD" }
 *
 * Responses:
 *   201 { order, requiresApproval, wasIdempotent }   — success
 *   400 { error, code }   — validation / stock / COD limit / serviceability
 *   401 { error, code }   — not authenticated
 *   404 { error, code }   — cart/address not found or IDOR attempt
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { createOrder } from "@/features/checkout/service";
import { toSafeError } from "@/lib/errors";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const session = await getServerSession();
    if (!session || !session.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email verification required before placing an order.", code: "UNVERIFIED_EMAIL" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const result = await createOrder(user.id, body);

    // 201 on fresh order, 200 on idempotent retrieval (no new resource created)
    const status = result.wasIdempotent ? 200 : 201;
    return NextResponse.json(result, { status });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
