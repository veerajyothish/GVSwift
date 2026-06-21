/**
 * GET /api/v1/admin/settings
 * PUT /api/v1/admin/settings
 *
 * Admin settings management endpoints. Requires ADMIN role.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { getAllSettings, updateSetting, getSetting } from "@/features/settings/service";
import { logAuditEvent } from "@/features/admin/audit-log";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const settings = await getAllSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function PUT(request: NextRequest) {
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

    // Support both single update { key, value } and batch update { settings: { ... } }
    if ("key" in body && "value" in body) {
      const { key, value } = body;
      const prevValue = await getSetting(key as any);
      await updateSetting(key, value);

      await logAuditEvent({
        actorId: user.id,
        action: "SETTINGS_UPDATE",
        details: {
          key,
          previousValue: prevValue,
          newValue: value,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else if ("settings" in body && typeof body.settings === "object" && body.settings !== null) {
      const updates = body.settings as Record<string, unknown>;
      const auditDetails: Record<string, { previous: unknown; new: unknown }> = {};

      for (const [key, value] of Object.entries(updates)) {
        const prevValue = await getSetting(key as any);
        await updateSetting(key, value);
        auditDetails[key] = { previous: prevValue, new: value };
      }

      await logAuditEvent({
        actorId: user.id,
        action: "SETTINGS_UPDATE",
        details: {
          batch: true,
          updates: auditDetails,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Invalid payload: must contain 'key'/'value' or 'settings'", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
