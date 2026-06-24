import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toSafeError } from "@/lib/errors";

export async function GET() {
  try {
    const activeBanner = await prisma.banner.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json(activeBanner, { status: 200 });
  } catch (err) {
    const { error, code, statusCode } = toSafeError(err);
    return NextResponse.json({ error, code }, { status: statusCode });
  }
}
