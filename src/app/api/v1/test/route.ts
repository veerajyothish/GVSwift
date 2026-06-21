import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";

/**
 * GET /api/v1/test
 *
 * Protected test route for verifying authentication and authorization.
 * Returns:
 *   - 401 if unauthenticated
 *   - 403 if authenticated but not an ADMIN
 *   - 200 if authorized (ADMIN)
 */
export async function GET() {
  const { user, errorResponse } = await requireAdminForApi();

  if (errorResponse) {
    return errorResponse;
  }

  return NextResponse.json(
    {
      message: "Authorized",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
    { status: 200 }
  );
}
