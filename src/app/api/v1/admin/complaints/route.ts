/**
 * GET /api/v1/admin/complaints
 *
 * Administrative endpoint to list support tickets. Protected by requireAdminForApi().
 *
 * Query Parameters:
 *   - status?: TicketStatus (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
 *
 * Responses:
 *   200 { success: true, tickets }
 *   401/403 for unauthorized access
 *   400 for validation errors
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { listAllTickets } from "@/features/support/admin-service";
import { TicketStatus } from "@prisma/client";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const statusParam = request.nextUrl.searchParams.get("status");
    let status: TicketStatus | undefined;

    if (statusParam) {
      if (Object.values(TicketStatus).includes(statusParam as TicketStatus)) {
        status = statusParam as TicketStatus;
      } else {
        return NextResponse.json(
          { error: "Invalid ticket status filter", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
    }

    const tickets = await listAllTickets({ status });
    return NextResponse.json({ success: true, tickets });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
