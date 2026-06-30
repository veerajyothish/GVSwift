import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/coupons
 * Returns a list of all currently active and valid coupons for checkout display.
 */
export async function GET() {
  try {
    const now = new Date();
    
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
        AND: [
          {
            OR: [
              { maxUsage: 0 },
              {
                // usageCount < maxUsage
                maxUsage: { gt: prisma.coupon.fields.usageCount },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        minOrderPaise: true,
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(coupons, { status: 200 });
  } catch (err) {
    console.error("[Coupons] Failed to list active coupons:", err);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}
