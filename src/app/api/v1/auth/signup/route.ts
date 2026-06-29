/**
 * POST /api/v1/auth/signup
 *
 * Creates a new user account (Supabase Auth + Prisma User row).
 * Rate limiting applied in TICKET-901.
 *
 * Request body: { email: string, password: string }
 * Response: 201 { message: string } | 400/409/500 { error, code }
 *
 * B12: Reads gvs_ref cookie to capture referral code at signup time.
 */

import { NextRequest, NextResponse } from "next/server";
import { signupUser } from "@/features/auth/service";
import { toSafeError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // B12: Read referral code from HttpOnly cookie set by /api/v1/loyalty/ref-capture
    const referralCode = request.cookies.get("gvs_ref")?.value ?? undefined;

    await signupUser(body, referralCode);

    logger.info(
      {
        email: body.email,
        referred: !!referralCode,
      },
      "User signed up successfully"
    );

    // Clear the referral cookie after use
    const response = NextResponse.json(
      {
        message:
          "Account created. Please check your email to verify your account.",
      },
      { status: 201 }
    );
    if (referralCode) {
      response.cookies.set("gvs_ref", "", { maxAge: 0, path: "/" });
    }
    return response;
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
