/**
 * GET /api/v1/admin/risk
 * POST /api/v1/admin/risk
 *
 * Admin risk flag management endpoints. Requires ADMIN role.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { listRiskFlags, createRiskFlag } from "@/features/risk/service";
import { logAuditEvent } from "@/features/admin/audit-log";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const entityType = searchParams.get("entityType") || undefined;
    const entityValue = searchParams.get("entityValue") || undefined;
    const riskLevel = searchParams.get("riskLevel") || undefined;

    const result = await listRiskFlags({
      page,
      limit,
      entityType,
      entityValue,
      riskLevel,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { entityType, entityValue, riskLevel, reason } = body;

    // Validate reason is present
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return NextResponse.json(
        { error: "A reason is required to document this manual risk flag change", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const flag = await createRiskFlag({
      entityType,
      entityValue,
      riskLevel,
    });

    // Write audit log
    await logAuditEvent({
      actorId: user.id,
      action: "RISK_FLAG_CREATE",
      details: {
        entityType,
        entityValue,
        riskLevel,
        reason,
        flagId: flag.id,
      },
    });

    return NextResponse.json(flag, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
