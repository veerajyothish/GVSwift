import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import BannersListTable from "./components/BannersListTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Banner Management — GVSwift Admin",
};

export default async function AdminBannersPage() {
  // Protect route
  await requireAdmin();

  // Load banners
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Convert Date fields to string/ISO format for client serialization compatibility
  const serializedBanners = banners.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return <BannersListTable initialBanners={serializedBanners} />;
}
