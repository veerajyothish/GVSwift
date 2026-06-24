/**
 * GET /api/v1/admin/loyalty/users
 *
 * Returns paginated users with their loyalty balance, ordered by balance desc.
 * Admin only.
 *
 * Query params: page (default 1), pageSize (default 20, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const skip = (page - 1) * pageSize;

  const [accounts, total] = await Promise.all([
    prisma.loyaltyAccount.findMany({
      orderBy: { balance: "desc" },
      skip,
      take: pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.loyaltyAccount.count(),
  ]);

  return NextResponse.json({
    data: accounts.map((a) => ({
      userId: a.userId,
      name: a.user.name,
      email: a.user.email,
      balance: a.balance,
      loyaltyAccountId: a.id,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
