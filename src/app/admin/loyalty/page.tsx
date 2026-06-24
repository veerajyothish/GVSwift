import { requireAdmin } from "@/lib/auth/guards";
import { getLoyaltySettings } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";
import AdminLoyaltyClient from "./AdminLoyaltyClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty Settings — Admin | GVSwift",
};

export default async function AdminLoyaltyPage() {
  await requireAdmin();

  const [settings, topAccounts, total] = await Promise.all([
    getLoyaltySettings(),
    prisma.loyaltyAccount.findMany({
      orderBy: { balance: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.loyaltyAccount.count(),
  ]);

  const topUsers = topAccounts.map((a) => ({
    userId: a.userId,
    name: a.user.name,
    email: a.user.email,
    balance: a.balance,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1
          className="text-3xl font-semibold text-primary mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Loyalty & Referrals
        </h1>
        <p className="text-secondary text-sm">
          Configure points rates and view top members by balance.
        </p>
      </header>

      <AdminLoyaltyClient
        settings={settings}
        topUsers={topUsers}
        total={total}
      />
    </div>
  );
}
