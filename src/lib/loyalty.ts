/**
 * lib/loyalty.ts — Referral & Loyalty Points Helper Functions
 *
 * B12: Central loyalty logic used by API routes and the checkout service.
 *
 * All balance mutations go through awardPoints() which is atomic:
 *   - Creates a PointsLedger entry
 *   - Updates LoyaltyAccount.balance in the same transaction
 *
 * Public functions:
 *   getOrCreateLoyaltyAccount(userId)
 *   getOrCreateReferralCode(userId)
 *   awardPoints(userId, delta, reason, orderId?)
 *   getLoyaltySettings()
 */

import { prisma } from "@/lib/prisma";

/** Characters used for referral code generation — no ambiguous chars (0/O, 1/I/l) */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** Generate a random 8-char alphanumeric referral code */
function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Finds or creates a LoyaltyAccount for a user.
 * Safe to call multiple times — idempotent.
 */
export async function getOrCreateLoyaltyAccount(userId: string) {
  const existing = await prisma.loyaltyAccount.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return prisma.loyaltyAccount.create({
    data: { userId, balance: 0 },
  });
}

/**
 * Finds or creates a unique 8-character alphanumeric ReferralCode for a user.
 * Retries up to 5 times on collision (extremely rare).
 */
export async function getOrCreateReferralCode(userId: string) {
  const existing = await prisma.referralCode.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      return await prisma.referralCode.create({
        data: { userId, code },
      });
    } catch (err: unknown) {
      // P2002 = unique constraint on code — retry with a new code
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === "P2002") continue;
      throw err;
    }
  }

  throw new Error("Failed to generate a unique referral code after 5 attempts");
}

/**
 * Awards (or deducts) points for a user atomically.
 *
 * @param userId  - The user receiving the points
 * @param delta   - Positive to award, negative to deduct
 * @param reason  - Human-readable description (shown in ledger)
 * @param orderId - Optional order ID for traceability
 *
 * Throws if the resulting balance would be negative (for deductions).
 */
export async function awardPoints(
  userId: string,
  delta: number,
  reason: string,
  orderId?: string
): Promise<void> {
  const account = await getOrCreateLoyaltyAccount(userId);

  if (delta < 0 && account.balance + delta < 0) {
    throw new Error(
      `Insufficient points balance. Has ${account.balance}, needs ${Math.abs(delta)}.`
    );
  }

  await prisma.$transaction([
    prisma.pointsLedger.create({
      data: {
        loyaltyAccountId: account.id,
        delta,
        reason,
        orderId: orderId ?? null,
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { balance: { increment: delta } },
    }),
  ]);
}

/**
 * Fetches the singleton LoyaltySettings row.
 * Creates a default row if none exists (first run).
 */
export async function getLoyaltySettings() {
  const settings = await prisma.loyaltySettings.findFirst();
  if (settings) return settings;

  // Seed default settings on first access
  return prisma.loyaltySettings.create({
    data: {
      pointsPerRupee: 1,
      rupeesPer100Points: 10,
      referralBonus: 500,
    },
  });
}
