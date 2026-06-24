/**
 * GET  /api/v1/admin/loyalty/settings — returns current LoyaltySettings
 * PATCH /api/v1/admin/loyalty/settings — updates pointsPerRupee, rupeesPer100Points, referralBonus
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { getLoyaltySettings } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const settings = await getLoyaltySettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const updates: Record<string, number> = {};

  if (body.pointsPerRupee !== undefined) {
    const v = Number(body.pointsPerRupee);
    if (!Number.isInteger(v) || v < 0) {
      return NextResponse.json(
        { error: "pointsPerRupee must be a non-negative integer", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    updates.pointsPerRupee = v;
  }

  if (body.rupeesPer100Points !== undefined) {
    const v = Number(body.rupeesPer100Points);
    if (!Number.isInteger(v) || v < 0) {
      return NextResponse.json(
        { error: "rupeesPer100Points must be a non-negative integer", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    updates.rupeesPer100Points = v;
  }

  if (body.referralBonus !== undefined) {
    const v = Number(body.referralBonus);
    if (!Number.isInteger(v) || v < 0) {
      return NextResponse.json(
        { error: "referralBonus must be a non-negative integer", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    updates.referralBonus = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Upsert — create if missing, update if exists
  const existing = await getLoyaltySettings();
  const updated = await prisma.loyaltySettings.update({
    where: { id: existing.id },
    data: updates,
  });

  return NextResponse.json(updated);
}
