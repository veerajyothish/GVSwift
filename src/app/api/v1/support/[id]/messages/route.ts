/**
 * POST /api/v1/support/[id]/messages
 *
 * Customer support ticket message reply endpoint.
 * Requires authentication.
 *
 * Request body (JSON):
 *   { message: string }
 *
 * Responses:
 *   201 { success: true, message }  — message added
 *   400 { error, code }            — validation/terminal state/bad request
 *   401 { error, code }            — unauthorized
 *   404 { error, code }            — ticket not found / IDOR protection
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { addCustomerMessage } from "@/features/support/service";
import { toSafeError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id: ticketId } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { message } = body as { message?: string };

    const createdMsg = await addCustomerMessage(user.id, ticketId, message ?? "");

    return NextResponse.json({ success: true, message: createdMsg }, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
