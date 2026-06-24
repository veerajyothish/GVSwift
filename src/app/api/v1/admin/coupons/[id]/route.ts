import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CouponType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/v1/admin/coupons/[id] — get a single coupon */
export async function GET(_req: Request, { params }: RouteParams) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  return NextResponse.json(coupon);
}

/** PUT /api/v1/admin/coupons/[id] — update a coupon */
export async function PUT(req: Request, { params }: RouteParams) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

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

  if (discountType && !["PERCENTAGE", "FIXED"].includes(discountType)) {
    return NextResponse.json({ error: "discountType must be PERCENTAGE or FIXED." }, { status: 400 });
  }
  const dv = discountValue !== undefined ? Number(discountValue) : undefined;
  if (dv !== undefined && (!Number.isFinite(dv) || dv <= 0)) {
    return NextResponse.json({ error: "discountValue must be a positive number." }, { status: 400 });
  }
  if (discountType === "PERCENTAGE" && dv !== undefined && dv > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100." }, { status: 400 });
  }

  // Check code uniqueness if changing code
  const codeUpper = typeof code === "string" ? code.trim().toUpperCase() : undefined;
  if (codeUpper && codeUpper !== existing.code) {
    const conflict = await prisma.coupon.findUnique({ where: { code: codeUpper } });
    if (conflict) {
      return NextResponse.json({ error: `Coupon code "${codeUpper}" already exists.` }, { status: 409 });
    }
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      ...(codeUpper ? { code: codeUpper } : {}),
      ...(discountType ? { discountType: discountType as CouponType } : {}),
      ...(dv !== undefined ? { discountValue: Math.round(dv) } : {}),
      ...(minOrderPaise !== undefined ? { minOrderPaise: Math.max(0, Math.round(Number(minOrderPaise))) } : {}),
      ...(maxUsage !== undefined ? { maxUsage: Math.max(0, Math.round(Number(maxUsage))) } : {}),
      ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
      ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
  });

  return NextResponse.json(updated);
}

/** DELETE /api/v1/admin/coupons/[id] — delete a coupon */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const { errorResponse } = await requireAdminForApi();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
