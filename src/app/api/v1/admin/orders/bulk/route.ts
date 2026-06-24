import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { toSafeError } from "@/lib/errors";

export async function PATCH(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { orderIds, status } = body as { orderIds?: string[]; status?: string };

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds must be a non-empty array", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (orderIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 orders per bulk operation", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(OrderStatus);
    if (!status || !validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: "Invalid status value", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const newStatus = status as OrderStatus;
    const adminUserId = user.id;

    const result = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({ 
        where: { id: { in: orderIds } },
        select: { id: true, status: true }
      });

      if (orders.length === 0) {
        return { updated: 0 };
      }

      const actualOrderIds = orders.map(o => o.id);

      const updateResult = await tx.order.updateMany({ 
        where: { id: { in: actualOrderIds } }, 
        data: { status: newStatus } 
      });

      await tx.orderStatusHistory.createMany({ 
        data: orders.map(o => ({
          orderId: o.id,
          fromStatus: o.status,
          toStatus: newStatus,
          changedById: adminUserId,
          createdAt: new Date()
        }))
      });

      return { updated: updateResult.count };
    });

    return NextResponse.json(result);
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
