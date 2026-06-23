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
      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-grow-1" style={{ maxWidth: "500px" }}>
          {/* Search bar */}
          <div className="input-group margin-0 flex-1">
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
          <div className="input-group margin-0" style={{ width: "180px", flexShrink: 0 }}>
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
              onClick={handleClearFilters}
              disabled={isPending}
            >
              Clear Filters
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => applyFilters(searchVal, categoryIdVal, 1)}
            disabled={isPending}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="table-responsive w-full">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Image</th>
              <th>Product Details</th>
              <th style={{ width: "120px" }}>Base Price</th>
              <th style={{ width: "120px" }}>Variants</th>
              <th style={{ width: "120px" }}>Total Stock</th>
              <th style={{ width: "120px" }}>Status</th>
              <th style={{ width: "180px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-secondary italic"
                  style={{ padding: "48px" }}
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
                    style={{ opacity: product.isActive ? 1 : 0.65 }}
                  >
                    {/* Thumbnail */}
                    <td>
                      <div className="admin-thumbnail">
                        {primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.name}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-xs text-secondary"
                            style={{ fontSize: "10px" }}
                          >
                            No Image
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Details */}
                    <td>
                      <div className="font-semibold text-primary">{product.name}</div>
                      <div className="text-xs text-secondary">{product.slug}</div>
                    </td>

                    {/* Price */}
                    <td className="font-medium">
                      ₹{(product.basePricePaise / 100).toFixed(2)}
                    </td>

                    {/* Variants count */}
                    <td>
                      {product.variants.length} variant(s)
                    </td>

                    {/* Total Stock */}
                    <td className="font-medium">
                      {totalStock} units
                    </td>

                    {/* Status */}
                    <td>
                      {product.isActive ? (
                        <span className="admin-badge admin-badge-success">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-error">
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className={product.isActive ? "btn btn-danger btn-sm" : "btn btn-primary btn-sm"}
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
        <div className="flex justify-between items-center mt-8">
          <div className="text-secondary text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => applyFilters(searchVal, categoryIdVal, currentPage - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => applyFilters(searchVal, categoryIdVal, currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
