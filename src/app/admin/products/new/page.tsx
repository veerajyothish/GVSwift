import React from "react";
import Link from "next/link";
import { listCategories } from "@/features/catalog/repository";
import ProductForm from "../components/ProductForm";

export default async function AdminNewProductPage() {
  const categories = await listCategories();

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "800px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Back button and title */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Link
          href="/admin/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--color-text-secondary)",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <svg style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Product Catalog
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-accent)", marginTop: "4px" }}>
          Add New Product
        </h1>
      </div>

      {/* Shared form */}
      <ProductForm categories={categories} />
    </div>
  );
}
