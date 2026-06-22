/**
 * POST /api/v1/orders/[id]/return
 *
 * Customer return request endpoint — requests return on a delivered order owned by the authenticated user.
 * TICKET-304. Requires authentication. All business logic lives in features/orders/service.ts.
 *
 * Request body (JSON):
 *   { reason: string }
 *
 * Responses:
 *   200 { success: true }   — return requested
 *   400 { error, code }     — validation / invalid transition / expired return window
 *   401 { error, code }     — not authenticated
 *   404 { error, code }     — order not found or IDOR attempt
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { requestReturn } from "@/features/orders/service";
import { toSafeError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id: orderId } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { reason } = body as { reason?: string };

    await requestReturn(user.id, orderId, reason ?? "");

    return NextResponse.json({ success: true });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
