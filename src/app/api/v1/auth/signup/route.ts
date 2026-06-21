/**
 * POST /api/v1/auth/signup
 *
 * Creates a new user account (Supabase Auth + Prisma User row).
 * Rate limiting applied in TICKET-901.
 *
 * Request body: { email: string, password: string }
 * Response: 201 { message: string } | 400/409/500 { error, code }
 */

import { NextRequest, NextResponse } from "next/server";
import { signupUser } from "@/features/auth/service";
import { toSafeError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await signupUser(body);

    return NextResponse.json(
      {
        message:
          "Account created. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
