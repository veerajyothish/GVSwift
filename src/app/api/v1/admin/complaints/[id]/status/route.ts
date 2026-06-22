/**
 * PATCH /api/v1/admin/complaints/[id]/status
 *
 * Administrative endpoint to update a support ticket status.
 * Protected by requireAdminForApi().
 *
 * Request body (JSON):
 *   {
 *     status: TicketStatus
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { updateTicketStatus } from "@/features/support/admin-service";
import { TicketStatus } from "@prisma/client";
import { toSafeError } from "@/lib/errors";

export async function PATCH(
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

    const { status } = body as { status?: string };

    if (!status || !Object.values(TicketStatus).includes(status as TicketStatus)) {
      return NextResponse.json(
        { error: "Valid status field is required.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updatedTicket = await updateTicketStatus(user.id, ticketId, status as TicketStatus);

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
