import React from "react";
import Link from "next/link";
import { listProducts, listCategories } from "@/features/catalog/repository";
import ProductListTable from "./components/ProductListTable";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const search = resolvedParams.search || undefined;
  const categoryId = resolvedParams.categoryId || undefined;

  // Fetch paginated products (including inactive) and all categories
  const [productsResult, categories] = await Promise.all([
    listProducts({
      page,
      limit: 20,
      search,
      categoryId,
      includeInactive: true, // admin sees both active and inactive
    }),
    listCategories(),
  ]);

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Header section */}
      <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>Product Catalog Management</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Add, update, activate or deactivate products in your store.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn btn-primary"
          style={{ minHeight: "44px" }}
        >
          <svg style={{ width: "20px", height: "20px", marginRight: "6px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Main product table */}
      <ProductListTable
        initialProducts={productsResult.products}
        categories={categories}
        totalPages={productsResult.totalPages}
        currentPage={productsResult.page}
      />
    </div>
  );
}
