"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProductWithVariantsAndImages } from "@/features/catalog/types";
import { useToast } from "@/components/ui/Toast";

interface ProductListTableProps {
  initialProducts: ProductWithVariantsAndImages[];
  categories: Array<{ id: string; name: string }>;
  totalPages: number;
  currentPage: number;
  lowStockThreshold: number;
  isLowStockFilter: boolean;
}

export default function ProductListTable({
  initialProducts,
  categories,
  totalPages,
  currentPage,
  lowStockThreshold,
  isLowStockFilter,
}: ProductListTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [products, setProducts] = useState<ProductWithVariantsAndImages[]>(initialProducts);
  const [searchVal, setSearchVal] = useState(searchParams.get("search") ?? "");
  const [categoryIdVal, setCategoryIdVal] = useState(searchParams.get("categoryId") ?? "");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync state with incoming props (when page/params change via router)
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Update URL parameters
  const applyFilters = (search: string, categoryId: string, pageNum = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }

    if (pageNum > 1) {
      params.set("page", pageNum.toString());
    } else {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters(searchVal, categoryIdVal, 1);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setCategoryIdVal(catId);
    applyFilters(searchVal, catId, 1);
  };

  const handleClearFilters = () => {
    setSearchVal("");
    setCategoryIdVal("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handleToggleLowStock = () => {
    const params = new URLSearchParams();
    if (!isLowStockFilter) {
      params.set("filter", "lowstock");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Toggle activation / deactivation
  const handleToggleActive = async (product: ProductWithVariantsAndImages) => {
    setActionLoadingId(product.id);
    try {
      const willBeActive = !product.isActive;
      let res;
      if (!willBeActive) {
        // Deactivate (soft delete)
        res = await fetch(`/api/v1/admin/products/${product.id}`, {
          method: "DELETE",
        });
      } else {
        // Activate (PUT isActive: true)
        res = await fetch(`/api/v1/admin/products/${product.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: true }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product status.");
      }

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: willBeActive } : p))
      );

      toast.success(
        `Product "${product.name}" has been ${willBeActive ? "activated" : "deactivated"}.`,
        "Success"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.", "Error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Filter Controls */}
      <div
        className="card p-4 flex flex-wrap gap-4 items-center justify-between"
        style={{
          backgroundColor: "var(--color-surface-container-low, #f6f3f2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg, 12px)",
        }}
      >
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px] max-w-[400px]">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary" style={{ fontSize: "20px" }}>
              search
            </span>
            <input
              type="text"
              className="input-field w-full"
              placeholder="Search products... (Press Enter)"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={{
                paddingLeft: "40px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                backgroundColor: "var(--color-surface)",
                fontSize: "14px",
                height: "40px",
              }}
            />
          </div>

          {/* Category drop down */}
          <select
            className="input-field"
            value={categoryIdVal}
            onChange={handleCategoryChange}
            style={{
              width: "180px",
              height: "40px",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              backgroundColor: "var(--color-surface)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Low Stock filter pill */}
          <button
            type="button"
            id="low-stock-filter-toggle"
            onClick={handleToggleLowStock}
            disabled={isPending}
            className={`btn-sm flex items-center gap-2 ${
              isLowStockFilter
                ? "btn btn-primary"
                : "btn btn-secondary"
            }`}
            style={{
              height: "40px",
              padding: "0 20px",
              borderRadius: "50px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>warning</span>
            {isLowStockFilter ? `Low Stock Only (Clear)` : `Low Stock`}
          </button>
        </div>

        <div className="flex gap-2 items-center">
          {(searchParams.has("search") || searchParams.has("categoryId") || searchVal || categoryIdVal) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearFilters}
              disabled={isPending}
              style={{
                height: "40px",
                borderRadius: "50px",
                padding: "0 20px",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Clear
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-premium"
            onClick={() => applyFilters(searchVal, categoryIdVal, 1)}
            disabled={isPending}
            style={{
              height: "40px",
              borderRadius: "50px",
              padding: "0 24px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div
        className="table-responsive w-full bg-surface rounded-xl border overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <table className="admin-table w-full text-left border-collapse" style={{ margin: 0 }}>
          <thead style={{ backgroundColor: "var(--color-surface-container-low, #f6f3f2)" }}>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ width: "80px", padding: "16px 20px" }}>Image</th>
              <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                Product Details
              </th>
              <th style={{ width: "130px", padding: "16px 20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                Base Price
              </th>
              <th style={{ width: "120px", padding: "16px 20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                Variants
              </th>
              <th style={{ width: "140px", padding: "16px 20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                Total Stock
              </th>
              <th style={{ width: "120px", padding: "16px 20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", textAlign: "center" }}>
                Status
              </th>
              <th style={{ width: "180px", padding: "16px 20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", textAlign: "right" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-secondary italic"
                  style={{ padding: "64px" }}
                >
                  No products found. Add a new product or adjust filters.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-default/40 transition-colors"
                    style={{
                      opacity: product.isActive ? 1 : 0.6,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: "16px 20px" }}>
                      <div
                        className="admin-thumbnail relative w-12 h-16 rounded-md overflow-hidden bg-default"
                        style={{ border: "1px solid var(--color-border)" }}
                      >
                        {primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-secondary"
                            style={{ fontSize: "10px" }}
                          >
                            No Image
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Details */}
                    <td style={{ padding: "16px 20px" }}>
                      <div className="font-semibold text-primary text-sm">{product.name}</div>
                      <div className="text-xs text-secondary font-mono mt-0.5">{product.slug}</div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "16px 20px", fontSize: "14px", fontWeight: 500 }} className="text-primary font-mono">
                      ₹{(product.basePricePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Variants count */}
                    <td style={{ padding: "16px 20px", fontSize: "14px" }} className="text-secondary">
                      {product.variants.length} variant(s)
                    </td>

                    {/* Total Stock */}
                    <td style={{ padding: "16px 20px", fontSize: "14px" }} className="text-primary font-medium">
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span>{totalStock} units</span>
                        {product.variants.some((v) => v.stock < lowStockThreshold) && (
                          <span
                            style={{
                              display: "inline-block",
                              alignSelf: "start",
                              backgroundColor: "var(--color-error)",
                              color: "#fff",
                              fontSize: "9px",
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              padding: "2px 8px",
                              borderRadius: "50px",
                              textTransform: "uppercase",
                            }}
                          >
                            ⚠️ Low Stock
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      {product.isActive ? (
                        <span
                          className="badge-premium"
                          style={{
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            color: "#059669",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            padding: "3px 10px",
                            fontSize: "10px",
                          }}
                        >
                          ACTIVE
                        </span>
                      ) : (
                        <span
                          className="badge-premium"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#dc2626",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            padding: "3px 10px",
                            fontSize: "10px",
                          }}
                        >
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div className="flex gap-2 justify-end items-center">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ borderRadius: "50px", fontSize: "12px", padding: "6px 14px", minHeight: "30px" }}
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className={`btn-sm ${product.isActive ? "btn btn-outline" : "btn btn-primary"}`}
                          onClick={() => handleToggleActive(product)}
                          disabled={actionLoadingId === product.id}
                          style={{
                            borderRadius: "50px",
                            fontSize: "12px",
                            padding: "6px 14px",
                            minHeight: "30px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {actionLoadingId === product.id ? (
                            "..."
                          ) : product.isActive ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="text-secondary text-xs font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => applyFilters(searchVal, categoryIdVal, currentPage - 1)}
              style={{ borderRadius: "50px", padding: "6px 16px" }}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => applyFilters(searchVal, categoryIdVal, currentPage + 1)}
              style={{ borderRadius: "50px", padding: "6px 16px" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
