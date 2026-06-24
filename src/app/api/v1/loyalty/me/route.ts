/**
 * GET /api/v1/loyalty/me
 *
 * Returns the authenticated user's loyalty account:
 *   { balance, referralCode, referralLink, ledger }
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { getOrCreateLoyaltyAccount, getOrCreateReferralCode } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app";

export async function GET() {
  const { user, errorResponse } = await requireUserForApi();
  if (errorResponse) return errorResponse;

  const [account, referralCodeRow] = await Promise.all([
    getOrCreateLoyaltyAccount(user.id),
    getOrCreateReferralCode(user.id),
  ]);

  // Fetch last 50 ledger entries, newest first
  const ledger = await prisma.pointsLedger.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      delta: true,
      reason: true,
      orderId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    balance: account.balance,
    referralCode: referralCodeRow.code,
    referralLink: `${SITE_URL}/signup?ref=${referralCodeRow.code}`,
    ledger: ledger.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
