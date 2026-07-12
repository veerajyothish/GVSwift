import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
import { getFeaturedProducts } from "@/features/catalog/repository";
import { getShops } from "@/features/catalog/service";
import ShopCard from "@/components/ui/ShopCard";
import { getServerSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/retry";
import ProductCard from "@/components/ui/ProductCard";
import { FadeIn, StaggerContainer, StaggerChild } from "@/components/ui/Animated";
import { ViewItemList } from "@/components/analytics/ViewItemList";
import { TrackedLink } from "@/components/analytics/TrackedLink";

import { getSiteUrl } from "@/lib/env";

export const metadata = {
  title: "GVSwift | Premium Fashion & Accessories",
  description:
    "Shop GVSwift for premium fashion and curated accessories. Experience uncompromising craftsmanship with Cash on Delivery across India, free shipping, and 7-day returns.",
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "GVSwift | Premium Fashion & Accessories",
    description: "Shop GVSwift for premium fashion and curated accessories. Experience uncompromising craftsmanship with Cash on Delivery across India.",
    url: getSiteUrl(),
    siteName: "GVSwift",
    type: "website",
  },
};

export default async function HomePage() {
  const [session, productsResult, featuredShops] = await Promise.all([
    getServerSession(),
    getFeaturedProducts(),
    getShops({ isActive: true, isFeatured: true }),
  ]);
  const { products } = productsResult;

  let wishlistedIds: string[] = [];
  if (session) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: wishlistItems } = await withRetry(async () => {
        const response = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", session.id);
        return response;
      });
      wishlistedIds = wishlistItems?.map((w) => w.product_id) ?? [];
    } catch (e) {
      console.error("Failed to fetch wishlisted IDs on server:", e);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${getSiteUrl()}/#website`,
        url: getSiteUrl(),
        name: "GVSwift",
        description: "Premium fashion with Cash on Delivery across India.",
        publisher: {
          "@id": `${getSiteUrl()}/#organization`,
        },
      },
      {
        "@type": "Organization",
        "@id": `${getSiteUrl()}/#organization`,
        name: "GVSwift",
        url: getSiteUrl(),
        logo: {
          "@type": "ImageObject",
          url: `${getSiteUrl()}/monogram.png`,
        },
      },
    ],
  };

  return (
    <div className="homepage-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <ViewItemList products={products} listId="homepage_trending" listName="Trending Now" />

      <main id="main-content">
        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "48px 24px 64px",
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr",
              gap: "72px",
              alignItems: "center",
            }}
            className="hero-grid-responsive"
          >
            {/* Left: Text block */}
            <div>
              {/* "INTRODUCING" eyebrow */}
              <FadeIn delay={0.05} y={15}>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--color-text-secondary)",
                    marginBottom: "20px",
                  }}
                >
                  Introducing
                </span>
              </FadeIn>

              {/* Large Garamond serif heading */}
              <FadeIn delay={0.15} duration={0.9} y={32}>
                <h1
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(44px, 5.5vw, 68px)",
                    fontWeight: 400,
                    fontStyle: "normal",
                    lineHeight: 1.07,
                    color: "var(--color-text-primary)",
                    marginBottom: "28px",
                    letterSpacing: "-0.01em",
                    textWrap: "balance",
                  }}
                >
                  Premium Fashion, Delivered Seamlessly.
                </h1>
              </FadeIn>

              <FadeIn delay={0.35} duration={0.7} y={20}>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.72,
                    color: "var(--color-text-secondary)",
                    marginBottom: "44px",
                    maxWidth: "360px",
                    textWrap: "pretty",
                  }}
                >
                  Discover uncompromising craftsmanship with Cash on Delivery and free shipping across India.
                </p>
              </FadeIn>

              {/* pill-shaped primary CTA */}
              <FadeIn delay={0.55} duration={0.6} y={16}>
                <TrackedLink
                  eventName="hero_cta_click"
                  href="/products"
                  className="btn btn-primary btn-premium"
                  style={{ padding: "14px 40px", fontSize: "12px", letterSpacing: "0.1em" }}
                >
                  Shop the Collection &rarr;
                </TrackedLink>
                <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                  <span>🔒 Secure Checkout</span>
                  <span>•</span>
                  <span>🔄 7-Day Returns</span>
                  <span>•</span>
                  <span>💵 COD Available</span>
                  <span>•</span>
                  <span>📦 Free Delivery</span>
                </div>
              </FadeIn>
            </div>

            {/* Right: Large product image */}
            <FadeIn delay={0.2} duration={0.8} y={30} style={{ width: "100%" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  boxShadow: "var(--shadow-md)",
                }}
                className="hover-lift"
              >
                <Image
                  src="/silks_satins.png"
                  alt="GVSwift — The New Standard"
                  fill
                  priority
                  sizes="(max-width: 767px) 90vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--color-accent)" }}>⭐️⭐️⭐️⭐️⭐️</span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>Trusted by shoppers across India.</span>
          </div>
        </section>

        {/* ── AUTUMN EDIT BENTO ── */}
        <section
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "80px 24px",
            }}
          >
            {/* Section header */}
            <FadeIn>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "40px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--color-text-secondary)",
                      marginBottom: "8px",
                    }}
                  >
                    Bestsellers
                  </span>
                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(30px, 3.5vw, 42px)",
                      fontWeight: 400,
                      fontStyle: "normal",
                      color: "var(--color-text-primary)",
                      lineHeight: 1.15,
                    }}
                  >
                    The Seasonal Edit
                  </h2>
                </div>
                <TrackedLink
                  eventName="bestseller_cta_click"
                  href="/products?sort=newest"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-text-secondary)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Shop Bestsellers &rarr;
                </TrackedLink>
              </div>
            </FadeIn>

            {/* Bento Grid */}
            <StaggerContainer className="autumn-edit-grid">
              {/* Large featured card */}
              <StaggerChild>
                <div
                  className="hover-lift"
                  style={{
                    position: "relative",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    minHeight: "460px",
                    background: "var(--color-bg)",
                  }}
                >
                  <Image
                    src="/structured_wool_blazer.png"
                    alt="Reference Wool Coat"
                    fill
                    sizes="(max-width: 767px) 90vw, 55vw"
                    style={{ objectFit: "cover" }}
                  />
                  {/* Minimal glass overlay caption */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "20px",
                      left: "20px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "rgba(253, 250, 245, 0.85)",
                      backdropFilter: "blur(4px)",
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    New Arrivals &middot; Outerwear
                  </div>
                </div>
              </StaggerChild>

              {/* Second featured card */}
              <StaggerChild>
                <div
                  className="hover-lift"
                  style={{
                    position: "relative",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    minHeight: "460px",
                    background: "var(--color-bg)",
                  }}
                >
                  <Image
                    src="/accessory_suite.png"
                    alt="Reference Leathercraft"
                    fill
                    sizes="(max-width: 767px) 90vw, 55vw"
                    style={{ objectFit: "cover" }}
                  />
                  {/* Minimal glass overlay caption */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "20px",
                      left: "20px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "rgba(253, 250, 245, 0.85)",
                      backdropFilter: "blur(4px)",
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    Curated &middot; Accessories
                  </div>
                </div>
              </StaggerChild>
            </StaggerContainer>
          </div>
        </section>

        {/* ── EDITORIAL QUOTE ───────────────────────────────────────────────── */}
        <section
          style={{
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "88px 24px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "64px",
              alignItems: "center",
            }}
            className="editorial-grid-responsive"
          >
            {/* Quote panel */}
            <FadeIn>
              <div
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "20px",
                  border: "1px solid var(--color-border)",
                  padding: "52px 44px",
                  position: "relative",
                }}
              >
                {/* Large decorative quotemark */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "28px",
                    fontFamily: "var(--font-heading)",
                    fontSize: "96px",
                    lineHeight: 1,
                    color: "var(--color-text-secondary)",
                    opacity: 0.2,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  &ldquo;
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(16px, 1.8vw, 20px)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: 1.65,
                    color: "var(--color-text-primary)",
                    marginBottom: "32px",
                    position: "relative",
                    paddingTop: "16px",
                    textWrap: "pretty",
                  }}
                >
                  &ldquo;GVSwift redefines the boundary between accessory and
                  architecture. Each piece is a masterclass in intentional design,
                  meant to be inherited, not replaced.&rdquo;
                </p>
                {/* Attribution */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "1px",
                      background: "var(--color-primary)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--color-primary)",
                    }}
                  >
                    The Artisan Journal
                  </span>
                </div>
              </div>
            </FadeIn>

            {/* Close-up texture/material image */}
            <FadeIn delay={0.15}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Image
                  src="/premium_footwear.png"
                  alt="Artisan craftsmanship — material detail"
                  fill
                  sizes="(max-width: 767px) 90vw, 45vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── FEATURED SHOPS SECTION ───────────────────────────────────────── */}
        {featuredShops.length > 0 && (
          <section
            style={{
              background: "var(--color-surface)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "80px 24px",
              }}
            >
              {/* Section Header */}
              <FadeIn>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: "40px",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--color-text-secondary)",
                        marginBottom: "8px",
                      }}
                    >
                      Store Partners
                    </span>
                    <h2
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(30px, 3.5vw, 42px)",
                        fontWeight: 400,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.15,
                        margin: 0,
                      }}
                    >
                      Featured Shops
                    </h2>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-secondary)",
                        marginTop: "12px",
                        marginBottom: 0,
                        maxWidth: "500px",
                        lineHeight: 1.5,
                        textWrap: "pretty",
                      }}
                    >
                      Shop directly from the best local curators. Premium quality, verified boutiques.
                    </p>
                  </div>
                  <Link
                    href="/shops"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Explore All Shops &rarr;
                  </Link>
                </div>
              </FadeIn>

              {/* Shops Grid */}
              <ViewItemList listName="Featured Shops" listId="homepage_featured_shops" products={featuredShops}>
                <StaggerContainer
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "32px",
                  }}
                >
                  {featuredShops.map((shop, idx) => (
                    <StaggerChild key={shop.id}>
                      <ShopCard shop={shop} index={idx + 1} />
                    </StaggerChild>
                  ))}
                </StaggerContainer>
              </ViewItemList>
            </div>
          </section>
        )}

        {/* ── TRENDING NOW ──────────────────────────────────────────────────── */}
        {products.length > 0 ? (
          <section
            style={{
              background: "var(--color-bg)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "80px 24px",
              }}
            >
              <FadeIn>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "44px",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(28px, 3.5vw, 40px)",
                      fontWeight: 400,
                      color: "var(--color-text-primary)",
                      lineHeight: 1.15,
                    }}
                  >
                    Trending Now
                  </h2>
                  <TrackedLink
                    eventName="trending_cta_click"
                    href="/products"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    Browse All &rarr;
                  </TrackedLink>
                </div>
              </FadeIn>

              <StaggerContainer className="product-grid">
                {products.map((product, idx) => (
                  <StaggerChild key={product.id}>
                    <ProductCard
                      product={product}
                      initialWishlisted={wishlistedIds.includes(product.id)}
                      priority={idx < 2}
                      listName="Trending Now"
                      index={idx + 1}
                    />
                  </StaggerChild>
                ))}
              </StaggerContainer>
            </div>
          </section>
        ) : (
          <section
            style={{
              background: "var(--color-bg)",
              borderBottom: "1px solid var(--color-border)",
              padding: "80px 24px",
              textAlign: "center",
            }}
          >
            <FadeIn>
              <div style={{ maxWidth: "480px", margin: "0 auto" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(24px, 3vw, 32px)",
                    fontWeight: 400,
                    color: "var(--color-text-primary)",
                    marginBottom: "16px",
                  }}
                >
                  Collection Coming Soon
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                    marginBottom: "32px",
                    textWrap: "pretty",
                  }}
                >
                  Our collection is being carefully curated. Browse all available products in the meantime.
                </p>
                <Link href="/products" className="btn btn-primary" style={{ padding: "14px 40px", fontSize: "12px", letterSpacing: "0.1em" }}>
                  Browse Products
                </Link>
              </div>
            </FadeIn>
          </section>
        )}
      </main>
    </div>
  );
}