import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForApi } from "@/lib/auth/guards";
import { toSafeError } from "@/lib/errors";
import { BannerType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const existing = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Banner not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if ("message" in body) {
      const { message } = body;
      if (!message || typeof message !== "string") {
        return NextResponse.json(
          { error: "Message is required and must be a string", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      if (message.length > 200) {
        return NextResponse.json(
          { error: "Message cannot exceed 200 characters", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      updateData.message = message;
    }

    if ("type" in body) {
      const { type } = body;
      const allowedTypes = Object.values(BannerType);
      if (!allowedTypes.includes(type as BannerType)) {
        return NextResponse.json(
          { error: `Invalid type. Allowed types: ${allowedTypes.join(", ")}`, code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      updateData.type = type as BannerType;
    }

    if ("linkText" in body) {
      updateData.linkText = body.linkText || null;
    }

    if ("linkUrl" in body) {
      updateData.linkUrl = body.linkUrl || null;
    }

    let isTogglingActiveToTrue = false;
    if ("isActive" in body) {
      const { isActive } = body;
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      updateData.isActive = isActive;
      if (isActive) {
        isTogglingActiveToTrue = true;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isTogglingActiveToTrue) {
        // Deactivate all other banners
        await tx.banner.updateMany({
          where: { id: { not: id } },
          data: { isActive: false },
        });
      }

      return await tx.banner.update({
        where: { id },
        data: updateData,
      });
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const existing = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Banner not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
