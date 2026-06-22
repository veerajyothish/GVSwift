/**
 * GET /api/v1/admin/complaints/[id]
 *
 * Administrative endpoint to fetch support ticket details including all messages.
 * Protected by requireAdminForApi().
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { getTicketDetail } from "@/features/support/admin-service";
import { toSafeError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const ticket = await getTicketDetail(id);

    return NextResponse.json({ success: true, ticket });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
