import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CouponType } from "@prisma/client";

/** GET /api/v1/admin/coupons — list all coupons */
export async function GET() {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coupons);
}

/** POST /api/v1/admin/coupons — create a new coupon */
export async function POST(req: Request) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const body = await req.json().catch(() => ({}));
  const {
    code,
    discountType,
    discountValue,
    minOrderPaise,
    maxUsage,
    validFrom,
    validUntil,
    isActive,
  } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
  }
  if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
    return NextResponse.json({ error: "discountType must be PERCENTAGE or FIXED." }, { status: 400 });
  }
  const dv = Number(discountValue);
  if (!Number.isFinite(dv) || dv <= 0) {
    return NextResponse.json({ error: "discountValue must be a positive number." }, { status: 400 });
  }
  if (discountType === "PERCENTAGE" && dv > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100." }, { status: 400 });
  }

  const codeUpper = code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code: codeUpper } });
  if (existing) {
    return NextResponse.json({ error: `Coupon code "${codeUpper}" already exists.` }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: codeUpper,
      discountType: discountType as CouponType,
      discountValue: Math.round(dv),
      minOrderPaise: Math.max(0, Math.round(Number(minOrderPaise) || 0)),
      maxUsage: Math.max(0, Math.round(Number(maxUsage) || 0)),
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive: isActive !== false,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
