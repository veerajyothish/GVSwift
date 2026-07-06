import React from "react";
import { requireAdmin } from "@/lib/auth/guards";
import { getShopById } from "@/features/catalog/repository";
import ShopForm from "../../components/ShopForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Shop — GVSwift Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditShopPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const shop = await getShopById(id);
  if (!shop) {
    notFound();
  }

  // Format dates to ISO strings for client compatibility
  const formattedShop = {
    ...shop,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };

  return (
    <div className="admin-page-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Link
          href="/admin/shops"
          className="btn btn-sm btn-outline"
          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Edit Shop: {shop.name}
          </h1>
          <p className="admin-page-subtitle" style={{ margin: 0, marginTop: "2px" }}>
            Update brand profile, visibility, and description.
          </p>
        </div>
      </div>

      <div className="card p-6" style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
        <ShopForm initialData={formattedShop} />
      </div>
    </div>
  );
}
