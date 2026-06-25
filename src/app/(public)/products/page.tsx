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
  const [session, params, categories] = await Promise.all([
    getServerSession(),
    searchParams,
    getCategories(),
  ]);

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

  // Fetch products and wishlist items in parallel
  const wishlistPromise: Promise<string[]> = session
    ? createSupabaseServerClient().then(async (supabase) => {
        const { data: wishlistItems } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", session.id);
        return (wishlistItems?.map((w) => w.product_id) ?? []) as string[];
      }).catch(e => {
        console.error("Failed to fetch wishlisted IDs on server:", e);
        return [] as string[];
      })
    : Promise.resolve([] as string[]);

  const productsPromise = currentSearch
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
      });

  const [wishlistedIds, productsResult] = await Promise.all([
    wishlistPromise,
    productsPromise,
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
    <div className="homepage-wrapper bg-default min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-24 w-full">
        {/* ── Page Header ── */}
        <header className="text-center mb-16 py-8">
          <h1 className="text-primary mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "48px", fontStyle: "italic", fontWeight: 400 }}>
            {categorySlug ? categories.find(c => c.id === currentCategoryId)?.name : "The Heritage Collection"}
          </h1>
          <p className="text-secondary max-w-2xl mx-auto text-base" style={{ lineHeight: 1.6 }}>
            A curated selection of archival pieces and artisanal garments, embodying the unhurried craftsmanship and timeless elegance of our Visakhapatnam legacy.
          </p>
        </header>

        {/* ── Category Filters ── */}
        <nav className="flex flex-wrap justify-center gap-3 mb-12" aria-label="Product categories">
          <Link
            href={buildUrl({ categoryId: null, page: 1 })}
            className={`font-semibold text-xs px-4 py-2 border rounded-full transition-colors ${
              !currentCategoryId
                ? "bg-primary border-primary text-on-primary"
                : "bg-transparent border-border text-secondary hover:border-primary/50 hover:text-primary"
            }`}
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            All Products
          </Link>
          {categories.map((category) => {
            const isActive = currentCategoryId === category.id;
            return (
              <Link
                key={category.id}
                href={buildUrl({ categoryId: category.id, page: 1 })}
                className={`font-semibold text-xs px-4 py-2 border rounded-full transition-colors ${
                  isActive
                    ? "bg-primary border-primary text-on-primary"
                    : "bg-transparent border-border text-secondary hover:border-primary/50 hover:text-primary"
                }`}
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>

        {/* ── Sort & Price Filters Panel ── */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center py-6 border-b border-border mb-12 w-full">
          {/* Sort options */}
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Sort by:
            </span>
            <div className="flex flex-wrap gap-2">
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
                    className={`text-xs px-3 py-1.5 border rounded-full transition-all ${
                      isActive
                        ? "bg-primary/5 border-primary text-primary font-semibold"
                        : "bg-surface border-border text-primary hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Price Range options */}
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Price Range:
            </span>
            <div className="flex flex-wrap gap-2">
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
                    className={`text-xs px-3 py-1.5 border rounded-full transition-all ${
                      isActive
                        ? "bg-primary/5 border-primary text-primary font-semibold"
                        : "bg-surface border-border text-primary hover:border-primary/30"
                    }`}
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
          <div className="flex items-center gap-2 mb-8 bg-surface p-4 border border-border rounded-md text-sm">
            <span className="text-secondary">Search results for:</span>
            <strong className="text-primary">&ldquo;{currentSearch}&rdquo;</strong>
            <Link
              href={buildUrl({ page: 1 })}
              className="text-accent underline font-medium ml-auto"
            >
              Clear search
            </Link>
          </div>
        )}

        {/* ── Products Grid ── */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-lg max-w-md mx-auto px-6">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", color: "var(--color-primary)", marginBottom: "8px" }}>
              No products found
            </h3>
            <p className="text-sm text-secondary mb-8">
              We couldn&apos;t find any products matching your selection.
            </p>
            <Link href="/products" className="btn btn-primary btn-premium" style={{ display: "inline-flex" }}>
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
              <div className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-border w-full">
                {currentPage > 1 ? (
                  <Link href={buildUrl({ page: currentPage - 1 })} className="btn btn-secondary btn-premium" style={{ minWidth: "120px" }}>
                    &larr; Previous
                  </Link>
                ) : (
                  <Button variant="secondary" className="btn-premium" style={{ minWidth: "120px" }} disabled>
                    &larr; Previous
                  </Button>
                )}

                <span className="text-sm text-secondary font-medium">
                  Page <strong className="text-primary">{currentPage}</strong> of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link href={buildUrl({ page: currentPage + 1 })} className="btn btn-secondary btn-premium" style={{ minWidth: "120px" }}>
                    Next &rarr;
                  </Link>
                ) : (
                  <Button variant="secondary" className="btn-premium" style={{ minWidth: "120px" }} disabled>
                    Next &rarr;
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
