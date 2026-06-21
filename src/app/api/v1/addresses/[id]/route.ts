/**
 * GET /api/v1/addresses/[id]
 * PUT /api/v1/addresses/[id]
 * DELETE /api/v1/addresses/[id]
 *
 * Manage individual user addresses. Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { getAddress, updateAddress, deleteAddress } from "@/features/users/addresses";
import { toSafeError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const address = await getAddress(user.id, id);

    return NextResponse.json(address, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await updateAddress(user.id, id, body);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await deleteAddress(user.id, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
