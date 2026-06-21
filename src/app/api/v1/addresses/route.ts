/**
 * GET /api/v1/addresses
 * POST /api/v1/addresses
 *
 * User address management endpoints. Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { listAddresses, createAddress } from "@/features/users/addresses";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const addresses = await listAddresses(user.id);
    return NextResponse.json(addresses, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const address = await createAddress(user.id, body);
    return NextResponse.json(address, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
