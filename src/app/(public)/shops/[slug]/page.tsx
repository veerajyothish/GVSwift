import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug, getCategoriesForShop } from "@/features/catalog/service";
import { listProducts } from "@/features/catalog/repository";
import ProductCard from "@/components/ui/ProductCard";
import { Metadata } from "next";

export const revalidate = 300; // Cache for 5 minutes (300 seconds)

interface ShopPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const shop = await getShopBySlug(slug);
    if (!shop || !shop.isActive) return {};
    return {
      title: `${shop.name} Curation — GVSwift`,
      description: shop.tagline || shop.description,
    };
  } catch {
    return {};
  }
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const categorySlug = resolvedSearchParams.category;

  let shop;
  try {
    shop = await getShopBySlug(slug);
  } catch {
    return notFound();
  }

  if (!shop || !shop.isActive) {
    return notFound();
  }

  // Get categories scoped to this shop only
  const categories = await getCategoriesForShop(shop.id);

  // Find the selected category
  const selectedCategoryObj = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  // Use a fallback non-matching UUID if a category slug was provided but not found in the shop's categories
  const categoryFilterId = categorySlug
    ? (selectedCategoryObj?.id || "00000000-0000-0000-0000-000000000000")
    : undefined;

  // Load shop products
  const productsResult = await listProducts({
    shopId: shop.id,
    categoryId: categoryFilterId,
    includeInactive: false, // only active products on public storefront
    limit: 50,
  });

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Hero Banner Header */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "var(--color-surface-container-low, #f6f3f2)",
        }}
      >
        {/* Banner Cover Image (Blurred Background / Tint) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            opacity: 0.1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shop.brandImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(20px)" }}
            aria-hidden="true"
          />
        </div>

        {/* Content Area */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "56px 24px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "16px",
          }}
          className="animate-in"
        >
          {/* Back button */}
          <Link
            href="/shops"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-accent)",
              textDecoration: "none",
              marginBottom: "4px",
              backgroundColor: "rgba(107,30,46,0.06)",
              padding: "6px 14px",
              borderRadius: "50px",
              border: "1px solid rgba(107,30,46,0.1)",
            }}
          >
            ← Back to Shops
          </Link>

          {/* Shop Logo Avatar */}
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid var(--color-bg)",
              boxShadow: "0 8px 24px rgba(107,30,46,0.12)",
              backgroundColor: "var(--color-bg)",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shop.brandImage}
              alt={`${shop.name} logo`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading), 'EB Garamond', serif",
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--color-accent)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {shop.name}
          </h1>

          {shop.tagline && (
            <p
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-accent)",
                margin: 0,
                letterSpacing: "0.02em",
              }}
            >
              {shop.tagline}
            </p>
          )}

          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "var(--color-text-secondary)",
              maxWidth: "600px",
              margin: 0,
            }}
          >
            {shop.description}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px 24px" }}>
        {/* Scoped Category Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "36px",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "20px",
          }}
          className="animate-in delay-50"
        >
          <nav style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Link
              href={`/shops/${shop.slug}`}
              className={!categorySlug ? "category-link-active" : "category-link"}
            >
              All Collections
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shops/${shop.slug}?category=${cat.slug}`}
                className={categorySlug === cat.slug ? "category-link-active" : "category-link"}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {productsResult.products.length} product{productsResult.products.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* Product Grid / Empty State */}
        {productsResult.products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg, 12px)",
              maxWidth: "480px",
              margin: "0 auto",
            }}
            className="animate-in"
          >
            <p
              style={{
                fontFamily: "var(--font-heading), 'EB Garamond', serif",
                fontSize: "24px",
                fontStyle: "italic",
                color: "var(--color-accent)",
                marginBottom: "12px",
              }}
            >
              No products found
            </p>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "32px", lineHeight: 1.6 }}>
              {categorySlug
                ? `We couldn't find any products under this category for ${shop.name}.`
                : "This shop has not published any collections yet."}
            </p>
            {categorySlug && (
              <Link href={`/shops/${shop.slug}`} className="btn btn-primary btn-premium" style={{ display: "inline-flex" }}>
                View All Curation
              </Link>
            )}
          </div>
        ) : (
          <div className="product-grid animate-in">
            {productsResult.products.map((product, idx) => {
              const catName = categories.find((c) => c.id === product.categoryId)?.name || "";
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={catName}
                  priority={idx < 4}
                  initialWishlisted={false}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
