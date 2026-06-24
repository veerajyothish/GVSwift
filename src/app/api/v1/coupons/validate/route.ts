import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/coupons/validate
 * Public endpoint — validates a coupon code against the current cart total.
 * Does NOT increment usageCount (that happens at checkout).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const cartTotalPaise = typeof body.cartTotalPaise === "number" ? body.cartTotalPaise : 0;

  if (!code) {
    return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  }

  if (!coupon.isActive) {
    return NextResponse.json({ error: "This coupon is no longer active." }, { status: 400 });
  }

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    return NextResponse.json({ error: "This coupon is not yet valid." }, { status: 400 });
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
  }

  if (coupon.maxUsage > 0 && coupon.usageCount >= coupon.maxUsage) {
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
  }

  if (cartTotalPaise < coupon.minOrderPaise) {
    const minRupees = (coupon.minOrderPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 });
    return NextResponse.json(
      { error: `This coupon requires a minimum order of ₹${minRupees}.` },
      { status: 400 }
    );
  }

  // Calculate discount
  let discountPaise: number;
  if (coupon.discountType === "PERCENTAGE") {
    discountPaise = Math.round(cartTotalPaise * coupon.discountValue / 100);
  } else {
    discountPaise = Math.min(coupon.discountValue, cartTotalPaise);
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountPaise,
  });
}
