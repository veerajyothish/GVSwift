/**
 * POST /api/v1/admin/complaints/[id]/messages
 *
 * Administrative endpoint to reply to a support ticket or add an internal note.
 * Protected by requireAdminForApi().
 *
 * Request body (JSON):
 *   {
 *     message: string,
 *     isInternal: boolean
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { addAdminReply } from "@/features/support/admin-service";
import { toSafeError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { id: ticketId } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { message, isInternal } = body as { message?: string; isInternal?: boolean };

    if (message === undefined || typeof message !== "string" || isInternal === undefined || typeof isInternal !== "boolean") {
      return NextResponse.json(
        { error: "Fields 'message' (string) and 'isInternal' (boolean) are required.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const createdMessage = await addAdminReply(user.id, ticketId, message, isInternal);

    return NextResponse.json({ success: true, message: createdMessage });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
