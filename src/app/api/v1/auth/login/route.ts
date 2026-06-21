/**
 * POST /api/v1/auth/login
 *
 * Authenticates an existing user and returns the user details.
 * Rate limiting applied in TICKET-901.
 *
 * Request body: { email: string, password: string }
 * Response: 200 { user: { id, email, role } } | 400/401/500 { error, code }
 */

import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/features/auth/service";
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

    const user = await loginUser(body);

    return NextResponse.json(
      {
        message: "Successfully logged in",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
