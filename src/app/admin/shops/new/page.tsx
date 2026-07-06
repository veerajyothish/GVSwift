import React from "react";
import { requireAdmin } from "@/lib/auth/guards";
import ShopForm from "../components/ShopForm";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Shop — GVSwift Admin",
};

export default async function AdminNewShopPage() {
  await requireAdmin();

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
            Create New Shop
          </h1>
          <p className="admin-page-subtitle" style={{ margin: 0, marginTop: "2px" }}>
            Add a new offline-to-online partner store to the marketplace.
          </p>
        </div>
      </div>

      <div className="card p-6" style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
        <ShopForm />
      </div>
    </div>
  );
}
