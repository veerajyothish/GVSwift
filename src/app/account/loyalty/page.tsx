import { requireUser } from "@/lib/auth/guards";
import {
  getOrCreateLoyaltyAccount,
  getOrCreateReferralCode,
  getLoyaltySettings,
} from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";
import LoyaltyPageClient from "./LoyaltyPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty & Referrals — GVSwift",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app";

export default async function LoyaltyPage() {
  const user = await requireUser();

  const [account, referralCodeRow, settings] = await Promise.all([
    getOrCreateLoyaltyAccount(user.id),
    getOrCreateReferralCode(user.id),
    getLoyaltySettings(),
  ]);

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

  return (
    <div className="flex flex-col gap-5 w-full">
      <header className="mb-4">
        <h1
          className="text-3xl font-semibold mb-2 text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Loyalty & Referrals
        </h1>
        <p className="text-secondary text-sm">
          Earn points on every purchase and refer friends to unlock bonus rewards.
        </p>
      </header>

      <LoyaltyPageClient
        balance={account.balance}
        referralCode={referralCodeRow.code}
        referralLink={`${SITE_URL}/signup?ref=${referralCodeRow.code}`}
        rupeesPer100Points={settings.rupeesPer100Points}
        ledger={ledger.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
