/**
 * POST /api/v1/support
 *
 * Customer support ticket creation endpoint.
 * Requires authentication.
 *
 * Request body (JSON):
 *   { subject: string, description?: string, orderId?: string }
 *
 * Responses:
 *   201 { success: true, ticket }  — ticket created
 *   400 { error, code }            — validation/bad request
 *   401 { error, code }            — unauthorized
 *   429 { error, code }            — rate limited
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { createTicket } from "@/features/support/service";
import { toSafeError } from "@/lib/errors";

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

    const { subject, description, orderId } = body as {
      subject?: string;
      description?: string;
      orderId?: string;
    };

    const ticket = await createTicket(user.id, {
      subject: subject ?? "",
      description,
      orderId,
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
