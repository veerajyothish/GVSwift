import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find the first active welcome offer
    let offer = await prisma.welcomeOffer.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Fallback if none is active or exists yet, return a default template
    if (!offer) {
      offer = await prisma.welcomeOffer.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(offer || null, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Failed to fetch welcome offer:", error);
    return NextResponse.json({ error: "Failed to fetch welcome offer" }, { status: 500 });
  }
}
