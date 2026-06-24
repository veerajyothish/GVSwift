import React from "react";
import Link from "next/link";
import { listProducts, listCategories } from "@/features/catalog/repository";
import ProductListTable from "./components/ProductListTable";
import { getLowStockThreshold } from "@/features/settings/service";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    filter?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const search = resolvedParams.search || undefined;
  const categoryId = resolvedParams.categoryId || undefined;
  const filterLowStock = resolvedParams.filter === "lowstock";

  // Fetch threshold from settings (falls back to 10 if not set)
  const lowStockThreshold = await getLowStockThreshold();

  // Fetch paginated products (including inactive) and all categories
  const [productsResult, categories] = await Promise.all([
    listProducts({
      page,
      limit: 20,
      search,
      categoryId,
      includeInactive: true, // admin sees both active and inactive
      lowStockOnly: filterLowStock,
      lowStockThreshold,
    }),
    listCategories(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header section */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Product Catalog Management</h1>
          <p className="text-secondary text-sm">
            Add, update, activate or deactivate products in your store.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn btn-primary"
        >
          <svg className="icon-sm" style={{ marginRight: "6px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
        lowStockThreshold={lowStockThreshold}
        isLowStockFilter={filterLowStock}
      />
    </div>
  );
}
