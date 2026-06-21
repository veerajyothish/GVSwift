/**
 * PUT /api/v1/admin/risk/[id]
 * DELETE /api/v1/admin/risk/[id]
 *
 * Manage individual risk flags. Requires ADMIN role.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { getRiskFlag, updateRiskFlag, deleteRiskFlag } from "@/features/risk/service";
import { logAuditEvent } from "@/features/admin/audit-log";
import { toSafeError } from "@/lib/errors";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { riskLevel, reason } = body;

    // Validate reason
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return NextResponse.json(
        { error: "A reason is required to edit this risk flag", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Get current state for audit log
    const flagBefore = await getRiskFlag(id);

    const updated = await updateRiskFlag(id, { riskLevel });

    // Write audit log
    await logAuditEvent({
      actorId: user.id,
      action: "RISK_FLAG_UPDATE",
      details: {
        flagId: id,
        entityType: flagBefore.entityType,
        entityValue: flagBefore.entityValue,
        previousLevel: flagBefore.riskLevel,
        newLevel: riskLevel,
        reason,
      },
    });

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
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    
    // Parse optional reason from body
    const body = await request.json().catch(() => null);
    const reason = body?.reason || "Deleted via admin interface";

    // Get info for audit logging before deleting
    const flagBefore = await getRiskFlag(id);

    await deleteRiskFlag(id);

    // Write audit log
    await logAuditEvent({
      actorId: user.id,
      action: "RISK_FLAG_DELETE",
      details: {
        flagId: id,
        entityType: flagBefore.entityType,
        entityValue: flagBefore.entityValue,
        deletedLevel: flagBefore.riskLevel,
        reason,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
