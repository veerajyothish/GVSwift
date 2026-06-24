import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForApi } from "@/lib/auth/guards";
import { toSafeError } from "@/lib/errors";
import { BannerType } from "@prisma/client";

export async function GET() {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(banners, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { message, type, linkText, linkUrl, isActive } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (message.length > 200) {
      return NextResponse.json(
        { error: "Message cannot exceed 200 characters", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const allowedTypes = Object.values(BannerType);
    const bannerType = type ? (type as BannerType) : BannerType.INFO;
    if (type && !allowedTypes.includes(bannerType)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed types: ${allowedTypes.join(", ")}`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (linkText && typeof linkText !== "string") {
      return NextResponse.json(
        { error: "linkText must be a string", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (linkUrl && typeof linkUrl !== "string") {
      return NextResponse.json(
        { error: "linkUrl must be a string", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const activeBool = typeof isActive === "boolean" ? isActive : false;

    const banner = await prisma.$transaction(async (tx) => {
      if (activeBool) {
        // Deactivate all other banners
        await tx.banner.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return await tx.banner.create({
        data: {
          message,
          type: bannerType,
          linkText: linkText || null,
          linkUrl: linkUrl || null,
          isActive: activeBool,
        },
      });
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
