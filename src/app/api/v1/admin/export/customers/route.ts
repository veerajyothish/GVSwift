import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const blocked = searchParams.get("blocked");

    const where: Prisma.UserWhereInput = {
      role: { not: "ADMIN" },
    };

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from + "T00:00:00.000Z");
      }
      if (to) {
        where.createdAt.lte = new Date(to + "T23:59:59.999Z");
      }
    }

    if (blocked === "true") {
      where.blocked = true;
    } else if (blocked === "false") {
      where.blocked = false;
    }

    const customers = await prisma.user.findMany({
      where,
      take: 10000,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        blocked: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          where: { status: "DELIVERED" },
          select: { totalPaise: true },
        },
      },
    });

    const mapped = customers.map((c) => ({
      "User ID": c.id,
      "Name": c.name ?? "",
      "Email": c.email,
      "Phone": c.phone ?? "",
      "Joined Date": c.createdAt.toISOString(),
      "Total Orders": c._count.orders,
      "Total Spend (₹)": (c.orders.reduce((sum, o) => sum + o.totalPaise, 0) / 100).toFixed(2),
      "Blocked": c.blocked ? "true" : "false",
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
