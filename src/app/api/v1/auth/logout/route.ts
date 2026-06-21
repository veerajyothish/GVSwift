/**
 * POST /api/v1/auth/logout
 *
 * Signs out the current user, clearing session cookies.
 *
 * Response: 200 { message: string } | 500 { error, code }
 */

import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/features/auth/service";
import { toSafeError } from "@/lib/errors";

export async function POST() {
  try {
    await logoutUser();

    return NextResponse.json(
      { message: "Successfully logged out" },
      { status: 200 }
    );
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
