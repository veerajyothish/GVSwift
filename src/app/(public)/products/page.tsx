import React from "react";
import Link from "next/link";
import { getProducts, getCategories } from "@/features/catalog/service";
import { searchProducts } from "@/features/catalog/search";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/ui/Navbar";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ui/ProductCard";
import { getServerSession } from "@/lib/auth/session";

interface ProductsPageProps {
  searchParams: Promise<{
    categoryId?: string;
    category?: string;
    page?: string;
    search?: string;
    sort?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await getServerSession();
  let wishlistedIds: string[] = [];
  if (session) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: wishlistItems } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", session.id);
      wishlistedIds = wishlistItems?.map((w) => w.product_id) ?? [];
    } catch (e) {
      console.error("Failed to fetch wishlisted IDs on server:", e);
    }
  }

  const params = await searchParams;
  let currentCategoryId = params.categoryId ?? "";
  const categorySlug = params.category ?? "";

  if (categorySlug && !currentCategoryId) {
    const matchedCategory = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (matchedCategory) {
      currentCategoryId = matchedCategory.id;
    }
  }

  const currentPage = Math.max(1, params.page ? parseInt(params.page, 10) : 1);
  const currentSearch = params.search ?? "";
  const currentSort = params.sort ?? "newest";
  const currentMaxPrice = params.maxPrice ?? "";

  // Fetch data in parallel
  // When a search query is present, delegate to the search abstraction
  // (TICKET-105: search logic lives entirely behind features/catalog/search.ts)
  const [categories, productsResult] = await Promise.all([
    getCategories(),
    currentSearch
      ? searchProducts({
          query: currentSearch,
          page: currentPage,
          limit: 12,
          categoryId: currentCategoryId || undefined,
          sort: currentSort,
          maxPrice: currentMaxPrice ? parseInt(currentMaxPrice, 10) : undefined,
        })
      : getProducts({
          page: currentPage.toString(),
          categoryId: currentCategoryId || undefined,
          limit: "12",
          sort: currentSort,
          maxPrice: currentMaxPrice || undefined,
        }),
  ]);

  const { products, totalPages } = productsResult;

  // Helper to build URLs preserving other parameters
  const buildUrl = (updates: {
    categoryId?: string | null;
    page?: number | null;
    sort?: string | null;
    maxPrice?: string | null;
  }) => {
    const urlParams = new URLSearchParams();
    
    // Preserve category unless explicitly cleared
    const catId = updates.categoryId !== undefined ? updates.categoryId : currentCategoryId;
    if (catId) {
      urlParams.set("categoryId", catId);
    }

    // Handle page
    const pg = updates.page !== undefined ? updates.page : currentPage;
    if (pg && pg > 1) {
      urlParams.set("page", pg.toString());
    }

    // Preserve search
    if (currentSearch) {
      urlParams.set("search", currentSearch);
    }

    // Preserve sort
    const s = updates.sort !== undefined ? updates.sort : currentSort;
    if (s && s !== "newest") {
      urlParams.set("sort", s);
    }

    // Preserve maxPrice
    const mp = updates.maxPrice !== undefined ? updates.maxPrice : currentMaxPrice;
    if (mp) {
      urlParams.set("maxPrice", mp);
    }

    const queryString = urlParams.toString();
    return `/products${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="homepage-wrapper">
      {/* ── Navbar with Search ── */}
      <Navbar />

      {/* ── Page Header ── */}
      <header className="products-header">
        <div className="products-header-inner">
          <h1 className="text-2xl margin-0 font-semibold">
            Shop Collection
          </h1>
          <p className="text-sm footer-text-muted" style={{ marginTop: "4px" }}>
            Explore fast fashion with secure Cash on Delivery (COD) services.
          </p>
        </div>
      </header>

      <main className="products-main">
        
        {/* ── Category Filters ── */}
        <nav className="products-filter-nav" aria-label="Product categories">
          <Link
            href={buildUrl({ categoryId: null, page: 1 })}
            className={!currentCategoryId ? "category-link-active" : "category-link"}
          >
            All Products
          </Link>
          {categories.map((category) => {
            const isActive = currentCategoryId === category.id;
            return (
              <Link
                key={category.id}
                href={buildUrl({ categoryId: category.id, page: 1 })}
                className={isActive ? "category-link-active" : "category-link"}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>

        {/* ── Sort & Price Filters ── */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
          {/* Sort options */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>SORT BY:</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: 'Newest', value: 'newest' },
                { label: 'Price: Low → High', value: 'price-asc' },
                { label: 'Price: High → Low', value: 'price-desc' },
              ].map((opt) => {
                const isActive = currentSort === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value, page: 1 })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 500,
                      textDecoration: "none",
                      border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
                      color: isActive ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Price Range options */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>PRICE RANGE:</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: 'All Prices', value: '' },
                { label: 'Under ₹500', value: '500' },
                { label: 'Under ₹1000', value: '1000' },
                { label: 'Under ₹2000', value: '2000' },
              ].map((opt) => {
                const isActive = currentMaxPrice === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={buildUrl({ maxPrice: opt.value || null, page: 1 })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 500,
                      textDecoration: "none",
                      border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
                      color: isActive ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Search Indicator (if active) ── */}
        {currentSearch && (
          <div className="search-indicator-row">
            <span className="text-sm footer-text-muted">
              Search results for:
            </span>
            <strong className="text-sm">&ldquo;{currentSearch}&rdquo;</strong>
            <Link
              href={buildUrl({ page: 1 })}
              className="search-indicator-clear"
            >
              Clear search
            </Link>
          </div>
        )}

        {/* ── Products Grid ── */}
        {products.length === 0 ? (
          <div className="products-empty-container">
            <h3 className="text-lg" style={{ marginBottom: "8px" }}>
              No products found
            </h3>
            <p className="text-sm footer-text-muted" style={{ marginBottom: "20px" }}>
              We couldn&apos;t find any products matching your selection.
            </p>
            <Link href="/products" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((product) => {
                const categoryName = categories.find((c) => c.id === product.categoryId)?.name || "Apparel";
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categoryName}
                    initialWishlisted={wishlistedIds.includes(product.id)}
                  />
                );
              })}
            </div>

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div className="pagination-container">
                {currentPage > 1 ? (
                  <Link href={buildUrl({ page: currentPage - 1 })} className="btn btn-secondary">
                    Previous
                  </Link>
                ) : (
                  <Button variant="secondary" disabled>
                    Previous
                  </Button>
                )}

                <span className="text-sm footer-text-muted">
                  Page <strong>{currentPage}</strong> of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link href={buildUrl({ page: currentPage + 1 })} className="btn btn-secondary">
                    Next
                  </Link>
                ) : (
                  <Button variant="secondary" disabled>
                    Next
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
