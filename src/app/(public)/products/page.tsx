import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getProducts, getCategories } from "@/features/catalog/service";
import { searchProducts } from "@/features/catalog/search";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/ui/Navbar";

interface ProductsPageProps {
  searchParams: Promise<{
    categoryId?: string;
    page?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const currentCategoryId = params.categoryId ?? "";
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
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      {/* ── Navbar with Search ── */}
      <Navbar />

      {/* ── Page Header ── */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          padding: "24px 0",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <h1 className="text-2xl" style={{ margin: 0, fontWeight: 600 }}>
            Shop Collection
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Explore fast fashion with secure Cash on Delivery (COD) services.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        
        {/* ── Category Filters ── */}
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "32px",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "16px",
          }}
          aria-label="Product categories"
        >
          <Link
            href={buildUrl({ categoryId: null, page: 1 })}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: !currentCategoryId ? "var(--color-accent)" : "var(--color-surface)",
              color: !currentCategoryId ? "var(--color-accent-text)" : "var(--color-text-primary)",
              border: `1px solid ${!currentCategoryId ? "var(--color-accent)" : "var(--color-border)"}`,
              transition: "all 0.2s ease",
            }}
          >
            All Products
          </Link>
          {categories.map((category) => {
            const isActive = currentCategoryId === category.id;
            return (
              <Link
                key={category.id}
                href={buildUrl({ categoryId: category.id, page: 1 })}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
                  color: isActive ? "var(--color-accent-text)" : "var(--color-text-primary)",
                  border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                  transition: "all 0.2s ease",
                }}
              >
                {category.name}
              </Link>
            );
          })}
        </nav>

        {/* ── Search Indicator (if active) ── */}
        {currentSearch && (
          <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Search results for:
            </span>
            <strong className="text-sm">&ldquo;{currentSearch}&rdquo;</strong>
            <Link
              href={buildUrl({ page: 1 })}
              style={{
                fontSize: "12px",
                color: "var(--color-error)",
                marginLeft: "8px",
                textDecoration: "underline",
              }}
            >
              Clear search
            </Link>
          </div>
        )}

        {/* ── Products Grid ── */}
        {products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3 className="text-lg" style={{ marginBottom: "8px" }}>
              No products found
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>
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
                const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
                const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";
                
                // Calculate stock
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                const isOutOfStock = totalStock === 0;

                // Format price
                const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString()}`;

                return (
                  <Card key={product.id} interactive className="card-product">
                    {/* Image section */}
                    <div className="card-product-image-container">
                      <Image
                        src={imageUrl}
                        alt={primaryImage?.altText || product.name}
                        className="card-product-image"
                        width={300}
                        height={300}
                        style={{ objectFit: "cover" }}
                      />
                      
                      {/* Out of Stock Badge */}
                      {isOutOfStock ? (
                        <span
                          className="text-xs font-semibold"
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            backgroundColor: "var(--color-error)",
                            color: "var(--color-text-on-dark)",
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          OUT OF STOCK
                        </span>
                      ) : totalStock <= 5 ? (
                        <span
                          className="text-xs font-semibold"
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            backgroundColor: "var(--color-warning)",
                            color: "var(--color-text-on-dark)",
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          ONLY {totalStock} LEFT
                        </span>
                      ) : null}
                    </div>

                    {/* Details section */}
                    <div className="card-product-content">
                      <h3 className="card-product-title">{product.name}</h3>
                      
                      {/* Category Label */}
                      {product.categoryId && (
                        <span
                          className="text-xs"
                          style={{
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: "8px",
                            display: "block",
                          }}
                        >
                          {categories.find((c) => c.id === product.categoryId)?.name || "Apparel"}
                        </span>
                      )}

                      <div
                        style={{
                          marginTop: "auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "between",
                          width: "100%",
                        }}
                      >
                        <span className="card-product-price" style={{ color: "var(--color-text-primary)" }}>
                          {formattedPrice}
                        </span>
                      </div>

                      <div style={{ marginTop: "16px" }}>
                        <Link
                          href={`/products/${product.slug}`}
                          className="w-full"
                          style={{ display: "block" }}
                        >
                          <Button
                            variant={isOutOfStock ? "secondary" : "primary"}
                            style={{ width: "100%" }}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? "View Out of Stock" : "Select Options"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "24px",
                  marginTop: "60px",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "24px",
                }}
              >
                {currentPage > 1 ? (
                  <Link href={buildUrl({ page: currentPage - 1 })} className="btn btn-secondary">
                    Previous
                  </Link>
                ) : (
                  <Button variant="secondary" disabled>
                    Previous
                  </Button>
                )}

                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
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
