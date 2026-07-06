/**
 * Admin Products — PDF p.17:
 * Left sidebar (same admin layout). Main: search bar top, "Catalog Management" heading,
 * "+ ADD NEW PRODUCT" wine-red pill btn right. Filter row: "FILTER BY: All Categories ▾
 * Status: All ▾ Stock: All ▾" + grid-view toggle. Active filter tags below (CATEGORY: OUTERWEAR ✕).
 * Table: checkbox | PRODUCT (thumb+name+SKU) | BASE PRICE | VARIANTS | INVENTORY | STATUS | ACTIONS.
 * Pagination: "Showing 1 to 3 of 45 entries  Prev [1] [2] [3] Next"
 * All data-fetching and table components untouched.
 */
import React from "react";
import Link from "next/link";
import { listProducts, listCategories, listShops } from "@/features/catalog/repository";
import ProductListTable from "./components/ProductListTable";
import ProductExportButton from "./components/ProductExportButton";
import { getLowStockThreshold } from "@/features/settings/service";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    shopId?: string;
    filter?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const search = resolvedParams.search || undefined;
  const categoryId = resolvedParams.categoryId || undefined;
  const shopId = resolvedParams.shopId || undefined;
  const filterLowStock = resolvedParams.filter === "lowstock";

  const lowStockThreshold = await getLowStockThreshold();

  const [productsResult, categories, shops] = await Promise.all([
    listProducts({
      page,
      limit: 20,
      search,
      categoryId,
      shopId,
      includeInactive: true,
      lowStockOnly: filterLowStock,
      lowStockThreshold,
    }),
    listCategories(),
    listShops(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      {/* PDF p.17: "Catalog Management" heading left, "+ ADD NEW PRODUCT" pill right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 400,
              fontStyle: "normal",
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            Catalog Management
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
            Manage your inventory, pricing, and product visibility.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <ProductExportButton />
          <Link
            href="/admin/products/new"
            className="btn btn-primary btn-premium"
            style={{ gap: "6px", padding: "10px 20px" }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Product
          </Link>
        </div>
      </div>

      {/* ── Low stock banner ───────────────────────────────────────────── */}
      {filterLowStock && (
        <div
          style={{
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-warning)" }}>
            ⚠ Showing low stock products (below {lowStockThreshold} units)
          </span>
          <Link
            href="/admin/products"
            style={{ fontSize: "12px", color: "var(--color-warning)", textDecoration: "underline" }}
          >
            Clear filter
          </Link>
        </div>
      )}

      {/* ── Product table — PDF p.17 layout ────────────────────────────── */}
      {/* ProductListTable renders filter row, table, and pagination internally */}
      <ProductListTable
        initialProducts={productsResult.products}
        categories={categories}
        shops={shops}
        totalPages={productsResult.totalPages}
        currentPage={productsResult.page}
        lowStockThreshold={lowStockThreshold}
        isLowStockFilter={filterLowStock}
      />
    </div>
  );
}