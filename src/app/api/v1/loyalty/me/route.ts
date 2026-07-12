/**
 * GET /api/v1/loyalty/me
 *
 * Returns the authenticated user's loyalty account:
 *   { balance, referralCode, referralLink, ledger }
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/guards";
import { getOrCreateLoyaltyAccount, getOrCreateReferralCode, getLoyaltySettings } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";

import { getSiteUrl } from "@/lib/env";
const SITE_URL = getSiteUrl();

export async function GET() {
  const { user, errorResponse } = await requireUserForApi();
  if (errorResponse) return errorResponse;

  const [account, referralCodeRow, settings] = await Promise.all([
    getOrCreateLoyaltyAccount(user.id),
    getOrCreateReferralCode(user.id),
    getLoyaltySettings(),
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
    rupeesPer100Points: settings.rupeesPer100Points,
    ledger: ledger.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
