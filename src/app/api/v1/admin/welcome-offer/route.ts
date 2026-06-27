import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminForApi } from "@/lib/auth/guards";
import { toSafeError } from "@/lib/errors";

export async function GET() {
  try {
    const { errorResponse } = await requireAdminForApi();
    if (errorResponse) return errorResponse;

    let offer = await prisma.welcomeOffer.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // If none exists, create a default one
    if (!offer) {
      offer = await prisma.welcomeOffer.create({
        data: {
          title: "Welcome back! 🎉",
          subtitle: "You have an exclusive deal waiting today.",
          offerText: "FLAT ₹100 OFF on your first order",
          offerSubtext: "Valid until July 25 · Applied automatically at checkout",
          ctaText: "Shop Now",
          ctaUrl: "/products",
          isActive: true,
        },
      });
    }

    return NextResponse.json(offer, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}

export async function PATCH(request: NextRequest) {
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

    // Find the latest welcome offer or create one
    let offer = await prisma.welcomeOffer.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!offer) {
      offer = await prisma.welcomeOffer.create({
        data: {
          title: body.title ?? "Welcome back! 🎉",
          subtitle: body.subtitle ?? "You have an exclusive deal waiting today.",
          offerText: body.offerText ?? "FLAT ₹100 OFF on your first order",
          offerSubtext: body.offerSubtext ?? "Valid until July 25 · Applied automatically at checkout",
          ctaText: body.ctaText ?? "Shop Now",
          ctaUrl: body.ctaUrl ?? "/products",
          isActive: body.isActive ?? true,
        },
      });
    } else {
      const updateData: Record<string, string | boolean> = {};
      if ("title" in body) updateData.title = String(body.title);
      if ("subtitle" in body) updateData.subtitle = String(body.subtitle);
      if ("offerText" in body) updateData.offerText = String(body.offerText);
      if ("offerSubtext" in body) updateData.offerSubtext = String(body.offerSubtext);
      if ("ctaText" in body) updateData.ctaText = String(body.ctaText);
      if ("ctaUrl" in body) updateData.ctaUrl = String(body.ctaUrl);
      if ("isActive" in body) updateData.isActive = Boolean(body.isActive);

      offer = await prisma.welcomeOffer.update({
        where: { id: offer.id },
        data: updateData,
      });
    }

    return NextResponse.json(offer, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
