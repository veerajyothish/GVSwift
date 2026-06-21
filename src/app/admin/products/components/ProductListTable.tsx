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
}

export default function ProductListTable({
  initialProducts,
  categories,
  totalPages,
  currentPage,
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
    <div className="flex flex-col gap-5 w-full">
      {/* Search & Filter Controls */}
      <div
        className="card p-4 flex flex-wrap gap-4 items-center justify-between"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3" style={{ flexGrow: 1, maxWidth: "500px" }}>
          {/* Search bar */}
          <div className="input-group" style={{ margin: 0, flexGrow: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search products by name or description... (Press Enter)"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {/* Category drop down */}
          <div className="input-group" style={{ margin: 0, width: "180px", flexShrink: 0 }}>
            <select
              className="input-field"
              value={categoryIdVal}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          {(searchParams.has("search") || searchParams.has("categoryId") || searchVal || categoryIdVal) && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: "44px" }}
              onClick={handleClearFilters}
              disabled={isPending}
            >
              Clear Filters
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: "44px" }}
            onClick={() => applyFilters(searchVal, categoryIdVal, 1)}
            disabled={isPending}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div
        className="card w-full"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "14px",
            color: "var(--color-text-primary)",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)", backgroundColor: "rgba(0,0,0,0.15)" }}>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)", width: "80px" }}>Image</th>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)" }}>Product Details</th>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)", width: "120px" }}>Base Price</th>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)", width: "120px" }}>Variants</th>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)", width: "120px" }}>Total Stock</th>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)", width: "120px" }}>Status</th>
              <th style={{ padding: "16px 20px", fontWeight: "600", color: "var(--color-accent)", width: "180px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                    fontStyle: "italic",
                  }}
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
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background-color 0.2s ease",
                      opacity: product.isActive ? 1 : 0.65,
                    }}
                    className="table-row-hover"
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: "12px 20px" }}>
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "var(--radius-sm)",
                          overflow: "hidden",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "rgba(0,0,0,0.1)",
                        }}
                      >
                        {primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Details */}
                    <td style={{ padding: "12px 20px" }}>
                      <div className="font-semibold" style={{ fontSize: "15px", color: "var(--color-text-primary)" }}>{product.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{product.slug}</div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "12px 20px" }} className="font-medium">
                      ₹{(product.basePricePaise / 100).toFixed(2)}
                    </td>

                    {/* Variants count */}
                    <td style={{ padding: "12px 20px" }}>
                      {product.variants.length} variant(s)
                    </td>

                    {/* Total Stock */}
                    <td style={{ padding: "12px 20px" }} className="font-medium">
                      {totalStock} units
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 20px" }}>
                      {product.isActive ? (
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            backgroundColor: "var(--color-success-bg)",
                            color: "var(--color-success)",
                          }}
                        >
                          ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            backgroundColor: "var(--color-error-bg)",
                            color: "var(--color-error)",
                          }}
                        >
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 20px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <Link href={`/admin/products/${product.id}`} className="btn btn-secondary" style={{ minHeight: "36px", padding: "4px 12px", fontSize: "13px" }}>
                          Edit
                        </Link>

                        <button
                          type="button"
                          className={product.isActive ? "btn btn-danger" : "btn btn-primary"}
                          style={{ minHeight: "36px", padding: "4px 12px", fontSize: "13px" }}
                          onClick={() => handleToggleActive(product)}
                          disabled={actionLoadingId === product.id}
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
        <div className="flex justify-between items-center" style={{ marginTop: "10px", padding: "0 10px" }}>
          <div style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: "38px", padding: "0 14px", fontSize: "13px" }}
              disabled={currentPage <= 1 || isPending}
              onClick={() => applyFilters(searchVal, categoryIdVal, currentPage - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: "38px", padding: "0 14px", fontSize: "13px" }}
              disabled={currentPage >= totalPages || isPending}
              onClick={() => applyFilters(searchVal, categoryIdVal, currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Style overrides for custom table hover */}
      <style jsx global>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
}
