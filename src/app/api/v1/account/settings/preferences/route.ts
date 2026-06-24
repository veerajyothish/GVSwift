import { NextRequest, NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { toSafeError } from "@/lib/errors";

export async function PUT(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUserForApi();
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be valid JSON", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { orderUpdates, promoEmails } = body as {
      orderUpdates?: boolean;
      promoEmails?: boolean;
    };

    // Store as JSON on the user record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          orderUpdates: !!orderUpdates,
          promoEmails: !!promoEmails,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updatedUser.preferences,
    });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
