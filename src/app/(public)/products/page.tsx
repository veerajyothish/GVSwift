import React, { Suspense } from "react";
import Link from "next/link";
import { getCachedProducts, getCachedCategories } from "@/features/catalog/cached-queries";
import { searchProducts } from "@/features/catalog/search";
import { Navbar } from "@/components/ui/Navbar";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/retry";
import ProductCard from "@/components/ui/ProductCard";
import { getServerSession } from "@/lib/auth/session";
import { ViewItemList } from "@/components/analytics/ViewItemList";
import { CatalogFilters } from "./components/CatalogFilters";

import { getSiteUrl } from "@/lib/env";

export const revalidate = 300;

export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  // Use clean canonical URL without sort/pagination for SEO
  let canonicalUrl = `${getSiteUrl()}/products`;
  
  if (params.categoryId) {
    // Note: ideally we would use the category slug if we had it, but using the base /products is safe
    // as a fallback canonical for filtered states.
    canonicalUrl = `${getSiteUrl()}/products`;
  }

  // If it's a search page, we usually noindex it to prevent infinite crawl spaces
  if (params.search) {
    return {
      title: `Search: ${params.search} | GVSwift`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: "All Products | GVSwift Premium Fashion",
    description: "Browse the complete GVSwift collection. Premium clothing and curated accessories crafted for quality.",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
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

/* ── Product grid as its own async component so Suspense can wrap it ── */
async function ProductGrid({
  products,
  wishlistedIds,
  categories,
}: {
  products: Awaited<ReturnType<typeof getCachedProducts>>["products"];
  wishlistedIds: string[];
  categories: Awaited<ReturnType<typeof getCachedCategories>>;
}) {
  if (products.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "24px",
            fontStyle: "italic",
            color: "var(--color-accent)",
            marginBottom: "12px",
          }}
        >
          No products found
        </p>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "32px", lineHeight: 1.6 }}>
          We couldn&apos;t find any products matching your selection.
        </p>
        <Link href="/products" className="btn btn-primary btn-premium" style={{ display: "inline-flex" }}>
          View All Products
        </Link>
      </div>
    );
  }

  return (
    <ViewItemList products={products} listId="plp_products" listName="All Products">
      <div className="product-grid animate-in">
        {products.map((product, idx) => {
          const categoryName = categories.find((c) => c.id === product.categoryId)?.name || "";
          return (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryName}
              initialWishlisted={wishlistedIds.includes(product.id)}
              priority={idx < 4}
              listName="All Products"
              index={idx + 1}
            />
          );
        })}
      </div>
    </ViewItemList>
  );
}

/* ── Skeleton fallback for product grid ── */
function ProductGridSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="sk-product-card">
          <div className="sk sk-img-3-4" style={{ borderRadius: 0 }} />
          <div className="sk-product-card-body">
            <span className="sk sk-h12 sk-w40" />
            <span className="sk sk-h16 sk-w100" />
            <span className="sk sk-h16 sk-w60" />
            <span className="sk sk-h20 sk-w30" style={{ marginTop: "4px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [session, params, categories] = await Promise.all([
    getServerSession(),
    searchParams,
    getCachedCategories(),
  ]);

  let currentCategoryId = params.categoryId ?? "";
  const categorySlug = params.category ?? "";

  if (categorySlug && !currentCategoryId) {
    const matchedCategory = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (matchedCategory) currentCategoryId = matchedCategory.id;
  }

  const currentPage = Math.max(1, params.page ? parseInt(params.page, 10) : 1);
  const currentSearch = params.search ?? "";
  const currentSort = params.sort ?? "newest";
  const currentMaxPrice = params.maxPrice ?? "";

  const wishlistPromise: Promise<string[]> = session
    ? createSupabaseServerClient()
        .then(async (supabase) => {
          const { data } = await withRetry(async () => {
            const response = await supabase
              .from("wishlists")
              .select("product_id")
              .eq("user_id", session.id);
            return response;
          });
          return (data?.map((w) => w.product_id) ?? []) as string[];
        })
        .catch(() => [] as string[])
    : Promise.resolve([] as string[]);

  // Use cached query for non-search, search bypasses cache (dynamic)
  const productsPromise = currentSearch
    ? searchProducts({
        query: currentSearch,
        page: currentPage,
        limit: 12,
        categoryId: currentCategoryId || undefined,
        sort: currentSort,
        maxPrice: currentMaxPrice ? parseInt(currentMaxPrice, 10) : undefined,
      })
    : getCachedProducts({
        page: currentPage,
        categoryId: currentCategoryId || undefined,
        limit: 12,
        sort: currentSort,
        maxPrice: currentMaxPrice ? parseInt(currentMaxPrice, 10) : undefined,
      });

  const [wishlistedIds, productsResult] = await Promise.all([
    wishlistPromise,
    productsPromise,
  ]);

  const { products, totalPages } = productsResult;

  const buildUrl = (updates: {
    categoryId?: string | null;
    page?: number | null;
    sort?: string | null;
    maxPrice?: string | null;
  }) => {
    const p = new URLSearchParams();
    const catId = updates.categoryId !== undefined ? updates.categoryId : currentCategoryId;
    if (catId) p.set("categoryId", catId);
    const pg = updates.page !== undefined ? updates.page : currentPage;
    if (pg && pg > 1) p.set("page", pg.toString());
    if (currentSearch) p.set("search", currentSearch);
    const s = updates.sort !== undefined ? updates.sort : currentSort;
    if (s && s !== "newest") p.set("sort", s);
    const mp = updates.maxPrice !== undefined ? updates.maxPrice : currentMaxPrice;
    if (mp) p.set("maxPrice", mp);
    const qs = p.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  const activeCategory = categories.find((c) => c.id === currentCategoryId);
  const pageTitle = activeCategory?.name ?? "The Heritage Collection";
  const pageDesc = activeCategory
    ? `Explore our ${activeCategory.name} collection — curated pieces embodying timeless craft.`
    : "A curated selection of archival pieces and artisanal garments, embodying the unhurried craftsmanship and timeless elegance of our founding legacy.";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content" style={{ flex: 1 }}>
        {/* Header */}
        <header
          style={{
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            padding: "56px 24px 48px",
            textAlign: "center",
          }}
          className="animate-in"
        >
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-text-primary)",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}
          >
            {pageTitle}
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.65, color: "var(--color-text-secondary)", maxWidth: "560px", margin: "0 auto" }}>
            {pageDesc}
          </p>
        </header>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px" }}>
          {/* Client-side Filters with Optimistic UI */}
          <CatalogFilters
            categories={categories}
            currentCategoryId={currentCategoryId}
            currentSort={currentSort}
            currentMaxPrice={currentMaxPrice}
            currentSearch={currentSearch}
          />

          {/* Search indicator */}
          {currentSearch && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px", padding: "12px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Results for:</span>
              <strong style={{ color: "var(--color-text-primary)" }}>&ldquo;{currentSearch}&rdquo;</strong>
              <Link href={buildUrl({ page: 1 })} style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-error)", textDecoration: "underline" }}>
                Clear
              </Link>
            </div>
          )}

          {/* Product grid wrapped in Suspense */}
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={products} wishlistedIds={wishlistedIds} categories={categories} />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "64px", paddingTop: "28px", borderTop: "1px solid var(--color-border)" }}>
              {currentPage > 1 ? (
                <Link href={buildUrl({ page: currentPage - 1 })} className="pagination-btn">&lsaquo;</Link>
              ) : (
                <button className="pagination-btn" disabled>&lsaquo;</button>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = i + 1;
                return (
                  <Link key={pg} href={buildUrl({ page: pg })} className={`pagination-btn${currentPage === pg ? " active" : ""}`}>
                    {pg}
                  </Link>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span style={{ padding: "8px 6px", color: "var(--color-text-secondary)", fontSize: "14px" }}>…</span>
                  <Link href={buildUrl({ page: totalPages })} className={`pagination-btn${currentPage === totalPages ? " active" : ""}`}>{totalPages}</Link>
                </>
              )}
              {currentPage < totalPages ? (
                <Link href={buildUrl({ page: currentPage + 1 })} className="pagination-btn">&rsaquo;</Link>
              ) : (
                <button className="pagination-btn" disabled>&rsaquo;</button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}