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

export const revalidate = 300;


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
          />
        );
      })}
    </div>
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

      <main style={{ flex: 1 }}>
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
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--color-accent)",
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
          {/* Category pills + sort */}
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "40px" }}
            className="animate-in delay-50"
          >
            <nav style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link href={buildUrl({ categoryId: null, page: 1 })} className={!currentCategoryId ? "category-link-active" : "category-link"}>
                All Products
              </Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={buildUrl({ categoryId: cat.id, page: 1 })} className={currentCategoryId === cat.id ? "category-link-active" : "category-link"}>
                  {cat.name}
                </Link>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Sort by:</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { label: "Featured", value: "newest" },
                  { label: "Price ↑", value: "price-asc" },
                  { label: "Price ↓", value: "price-desc" },
                ].map((opt) => (
                  <Link key={opt.value} href={buildUrl({ sort: opt.value, page: 1 })} style={{
                    fontSize: "13px", padding: "6px 14px", borderRadius: "9999px",
                    border: `1px solid ${currentSort === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: currentSort === opt.value ? "rgba(107,30,46,0.06)" : "transparent",
                    color: currentSort === opt.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                    fontWeight: currentSort === opt.value ? 600 : 400,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}>
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Price filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "36px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
              Price:
            </span>
            {[
              { label: "All", value: "" },
              { label: "Under ₹500", value: "500" },
              { label: "Under ₹1,000", value: "1000" },
              { label: "Under ₹2,000", value: "2000" },
            ].map((opt) => (
              <Link key={opt.value} href={buildUrl({ maxPrice: opt.value || null, page: 1 })} style={{
                fontSize: "12px", padding: "5px 14px", borderRadius: "9999px",
                border: `1px solid ${currentMaxPrice === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                background: currentMaxPrice === opt.value ? "rgba(107,30,46,0.06)" : "transparent",
                color: currentMaxPrice === opt.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                fontWeight: currentMaxPrice === opt.value ? 600 : 400,
                textDecoration: "none",
              }}>
                {opt.label}
              </Link>
            ))}
          </div>

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