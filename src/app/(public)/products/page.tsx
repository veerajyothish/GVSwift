import React from "react";
import Link from "next/link";
import { getProducts, getCategories } from "@/features/catalog/service";
import { searchProducts } from "@/features/catalog/search";
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

  const wishlistPromise: Promise<string[]> = session
    ? createSupabaseServerClient()
        .then(async (supabase) => {
          const { data: wishlistItems } = await supabase
            .from("wishlists")
            .select("product_id")
            .eq("user_id", session.id);
          return (wishlistItems?.map((w) => w.product_id) ?? []) as string[];
        })
        .catch((e) => {
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

  const buildUrl = (updates: {
    categoryId?: string | null;
    page?: number | null;
    sort?: string | null;
    maxPrice?: string | null;
  }) => {
    const urlParams = new URLSearchParams();
    const catId =
      updates.categoryId !== undefined ? updates.categoryId : currentCategoryId;
    if (catId) urlParams.set("categoryId", catId);
    const pg = updates.page !== undefined ? updates.page : currentPage;
    if (pg && pg > 1) urlParams.set("page", pg.toString());
    if (currentSearch) urlParams.set("search", currentSearch);
    const s = updates.sort !== undefined ? updates.sort : currentSort;
    if (s && s !== "newest") urlParams.set("sort", s);
    const mp = updates.maxPrice !== undefined ? updates.maxPrice : currentMaxPrice;
    if (mp) urlParams.set("maxPrice", mp);
    const queryString = urlParams.toString();
    return `/products${queryString ? `?${queryString}` : ""}`;
  };

  const activeCategory = categories.find((c) => c.id === currentCategoryId);
  const pageTitle = activeCategory?.name ?? "The Heritage Collection";
  const pageDesc = activeCategory
    ? `Explore our ${activeCategory.name} collection — curated pieces embodying timeless craft.`
    : "A curated selection of archival pieces and artisanal garments, embodying the unhurried craftsmanship and timeless elegance of our founding legacy.";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        {/* PDF p.6: centered, Garamond italic heading, muted subtitle, cream bg */}
        <header
          style={{
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            padding: "56px 24px 48px",
            textAlign: "center",
          }}
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
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.65,
              color: "var(--color-text-secondary)",
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            {pageDesc}
          </p>
        </header>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px 80px",
          }}
        >
          {/* ── Category Filter Pills ──────────────────────────────────────── */}
          {/* PDF p.6: "All Products | Apparel | Footwear | Heritage | Accessories"
              pills left-aligned, Sort by: Featured right-aligned */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            {/* Category pills */}
            <nav
              style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
              aria-label="Product categories"
            >
              <Link
                href={buildUrl({ categoryId: null, page: 1 })}
                className={!currentCategoryId ? "category-link-active" : "category-link"}
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={buildUrl({ categoryId: category.id, page: 1 })}
                  className={
                    currentCategoryId === category.id
                      ? "category-link-active"
                      : "category-link"
                  }
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Sort control — PDF: "Sort by: Featured ▾" right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                Sort by:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { label: "Featured", value: "newest" },
                  { label: "Price ↑", value: "price-asc" },
                  { label: "Price ↓", value: "price-desc" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value, page: 1 })}
                    style={{
                      fontSize: "13px",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      border: `1px solid ${
                        currentSort === opt.value
                          ? "var(--color-accent)"
                          : "var(--color-border)"
                      }`,
                      background:
                        currentSort === opt.value
                          ? "rgba(107,30,46,0.06)"
                          : "transparent",
                      color:
                        currentSort === opt.value
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                      fontWeight: currentSort === opt.value ? 600 : 400,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Price range filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "36px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
              }}
            >
              Price:
            </span>
            {[
              { label: "All", value: "" },
              { label: "Under ₹5,000", value: "5000" },
              { label: "Under ₹10,000", value: "10000" },
              { label: "Under ₹20,000", value: "20000" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ maxPrice: opt.value || null, page: 1 })}
                style={{
                  fontSize: "12px",
                  padding: "5px 14px",
                  borderRadius: "9999px",
                  border: `1px solid ${
                    currentMaxPrice === opt.value
                      ? "var(--color-accent)"
                      : "var(--color-border)"
                  }`,
                  background:
                    currentMaxPrice === opt.value
                      ? "rgba(107,30,46,0.06)"
                      : "transparent",
                  color:
                    currentMaxPrice === opt.value
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                  fontWeight: currentMaxPrice === opt.value ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* ── Search Indicator ──────────────────────────────────────────── */}
          {currentSearch && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "28px",
                padding: "12px 16px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
              }}
            >
              <span style={{ color: "var(--color-text-secondary)" }}>
                Results for:
              </span>
              <strong style={{ color: "var(--color-text-primary)" }}>
                &ldquo;{currentSearch}&rdquo;
              </strong>
              <Link
                href={buildUrl({ page: 1 })}
                style={{
                  marginLeft: "auto",
                  fontSize: "12px",
                  color: "var(--color-error)",
                  textDecoration: "underline",
                }}
              >
                Clear
              </Link>
            </div>
          )}

          {/* ── Products Grid ─────────────────────────────────────────────── */}
          {products.length === 0 ? (
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
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "32px",
                  lineHeight: 1.6,
                }}
              >
                We couldn&apos;t find any products matching your selection.
              </p>
              <Link
                href="/products"
                className="btn btn-primary btn-premium"
                style={{ display: "inline-flex" }}
              >
                View All Products
              </Link>
            </div>
          ) : (
            <>
              {/* PDF p.6/7: 4-col grid on desktop, cards show category label above name */}
              <div className="product-grid">
                {products.map((product) => {
                  const categoryName =
                    categories.find((c) => c.id === product.categoryId)?.name ||
                    "Apparel";
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

              {/* ── Pagination ────────────────────────────────────────────── */}
              {/* PDF p.7: numbered pages centred, previous/next arrows */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "64px",
                    paddingTop: "28px",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  {/* Prev arrow */}
                  {currentPage > 1 ? (
                    <Link
                      href={buildUrl({ page: currentPage - 1 })}
                      className="pagination-btn"
                      aria-label="Previous page"
                    >
                      &lsaquo;
                    </Link>
                  ) : (
                    <button className="pagination-btn" disabled aria-label="Previous page">
                      &lsaquo;
                    </button>
                  )}

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = i + 1;
                    return (
                      <Link
                        key={pg}
                        href={buildUrl({ page: pg })}
                        className={`pagination-btn${currentPage === pg ? " active" : ""}`}
                      >
                        {pg}
                      </Link>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span
                        style={{
                          padding: "8px 6px",
                          color: "var(--color-text-secondary)",
                          fontSize: "14px",
                        }}
                      >
                        …
                      </span>
                      <Link
                        href={buildUrl({ page: totalPages })}
                        className={`pagination-btn${currentPage === totalPages ? " active" : ""}`}
                      >
                        {totalPages}
                      </Link>
                    </>
                  )}

                  {/* Next arrow */}
                  {currentPage < totalPages ? (
                    <Link
                      href={buildUrl({ page: currentPage + 1 })}
                      className="pagination-btn"
                      aria-label="Next page"
                    >
                      &rsaquo;
                    </Link>
                  ) : (
                    <button className="pagination-btn" disabled aria-label="Next page">
                      &rsaquo;
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}