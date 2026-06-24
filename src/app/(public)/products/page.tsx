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
        })
      : getProducts({
          page: currentPage.toString(),
          categoryId: currentCategoryId || undefined,
          limit: "12",
        }),
  ]);

  const { products, totalPages } = productsResult;

  // Helper to build URLs preserving other parameters
  const buildUrl = (updates: { categoryId?: string | null; page?: number | null }) => {
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
