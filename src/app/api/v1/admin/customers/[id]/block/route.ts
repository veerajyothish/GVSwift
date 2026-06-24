import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/customers/[id]/block
 *
 * Toggles the blocked state of a customer account.
 *
 * Security rules:
 *   - Caller must be ADMIN (enforced by requireAdminForApi).
 *   - Admin cannot block themselves.
 *   - Admin cannot block another ADMIN account.
 *
 * Returns: { blocked: boolean } — the updated blocked state.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const { user: adminUser, errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { id: targetId } = await params;

  // Prevent self-blocking
  if (adminUser.id === targetId) {
    return NextResponse.json(
      { error: "You cannot block your own account.", code: "SELF_BLOCK_FORBIDDEN" },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, blocked: true },
  });

  if (!target) {
    return NextResponse.json(
      { error: "Customer not found.", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Prevent blocking another admin
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin accounts cannot be blocked.", code: "ADMIN_BLOCK_FORBIDDEN" },
      { status: 403 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { blocked: !target.blocked },
    select: { id: true, blocked: true },
  });

  return NextResponse.json({ id: updated.id, blocked: updated.blocked });
}
