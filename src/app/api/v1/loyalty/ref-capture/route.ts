/**
 * POST /api/v1/loyalty/ref-capture
 *
 * Public route (no auth required).
 * Validates that the referral code exists, then sets an HttpOnly cookie
 * `gvs_ref` so the signup flow can attribute the referral server-side.
 *
 * Body: { code: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json(
      { error: "code is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const code = body.code.trim().toUpperCase();

  // Validate the code exists
  const referralCode = await prisma.referralCode.findUnique({ where: { code } });
  if (!referralCode) {
    // Return 200 silently to avoid leaking which codes exist
    return NextResponse.json({ ok: true });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("gvs_ref", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });

  return response;
}
