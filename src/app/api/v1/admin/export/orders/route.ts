import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { toSafeError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where: Prisma.OrderWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as OrderStatus;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from + "T00:00:00.000Z");
      }
      if (to) {
        where.createdAt.lte = new Date(to + "T23:59:59.999Z");
      }
    }

    const orders = await prisma.order.findMany({
      where,
      take: 10000,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        address: true,
        items: true,
      },
    });

    const mapped = orders.map((o) => ({
      "Order ID": o.id,
      "Order Number": o.id.slice(0, 8).toUpperCase(),
      "Customer Name": o.user.name ?? "",
      "Customer Email": o.user.email,
      "Status": o.status,
      "Items Count": o.items.reduce((sum, item) => sum + item.quantity, 0),
      "Subtotal (₹)": (o.subtotalPaise / 100).toFixed(2),
      "Discount (₹)": (o.discountPaise / 100).toFixed(2),
      "Total (₹)": (o.totalPaise / 100).toFixed(2),
      "Coupon Code": o.couponCode ?? "",
      "Payment Method": o.paymentMethod,
      "Created Date": o.createdAt.toISOString(),
      "Shipping Name": o.address.fullName,
      "Shipping City": o.address.city,
      "Shipping State": o.address.state,
      "Shipping Pincode": o.address.pincode,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
