/**
 * POST /api/v1/loyalty/redeem
 *
 * Validates that the user has enough points to redeem.
 * Returns the discount amount in rupees.
 * Does NOT deduct points — deduction happens at checkout.
 *
 * Body: { pointsToRedeem: number }
 * Response: { discountAmount: number, discountPaise: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { getOrCreateLoyaltyAccount, getLoyaltySettings } from "@/lib/loyalty";

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUserForApi();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const pointsToRedeem = Number(body.pointsToRedeem);
  if (!Number.isInteger(pointsToRedeem) || pointsToRedeem <= 0) {
    return NextResponse.json(
      { error: "pointsToRedeem must be a positive integer", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const [account, settings] = await Promise.all([
    getOrCreateLoyaltyAccount(user.id),
    getLoyaltySettings(),
  ]);

  if (account.balance < pointsToRedeem) {
    return NextResponse.json(
      {
        error: `Insufficient points. You have ${account.balance} points but tried to redeem ${pointsToRedeem}.`,
        code: "INSUFFICIENT_POINTS",
      },
      { status: 400 }
    );
  }

  // Calculate discount: rupeesPer100Points defines how many rupees 100 points are worth
  const discountRupees = (pointsToRedeem / 100) * settings.rupeesPer100Points;
  const discountPaise = Math.floor(discountRupees * 100);

  return NextResponse.json({ discountAmount: discountRupees, discountPaise });
}
