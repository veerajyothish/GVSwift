import React from "react";
import Link from "next/link";
import Image from "next/image";

import { getFeaturedProducts } from "@/features/catalog/repository";
import { getShops } from "@/features/catalog/service";
import ShopCard from "@/components/ui/ShopCard";
import { getServerSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ui/ProductCard";
import { FadeIn, StaggerContainer, StaggerChild } from "@/components/ui/Animated";
import { ViewItemList } from "@/components/analytics/ViewItemList";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { TextEffect } from "@/components/motion-primitives/text-effect";

import { getSiteUrl } from "@/lib/env";

export const metadata = {
  title: 'GVSwift — Online Fashion Store in Andhra Pradesh',
  description:
    'GVSwift is an online fashion store delivering to Andhra Pradesh. ' +
    'Shop the latest styles and pay cash on delivery.',
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: 'GVSwift — Online Fashion Store in Andhra Pradesh',
    description: 'GVSwift is an online fashion store delivering to Andhra Pradesh. Shop the latest styles and pay cash on delivery.',
    url: getSiteUrl(),
    siteName: 'GVSwift',
    type: 'website',
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
      const { data: wishlistItems } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", session.id);
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
<ViewItemList products={products} listId="homepage_trending" listName="Trending Now" />

      <main id="main-content">
        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: "linear-gradient(to bottom, var(--color-bg), var(--color-surface))",
            borderBottom: "1px solid var(--color-border)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle background decoration */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "140vw",
              height: "100%",
              background: "radial-gradient(circle, rgba(140, 100, 100, 0.03) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "100px 24px 120px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Center: Text block */}
            <FadeIn delay={0.05} y={15}>
              <h2
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "var(--color-primary)",
                  marginBottom: "24px",
                  margin: 0,
                  paddingBottom: "24px",
                }}
              >
                Welcome to GVSwift
              </h2>
            </FadeIn>

            {/* Large Garamond serif heading */}
            <FadeIn delay={0.15} duration={0.9} y={32}>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(48px, 6vw, 76px)",
                  fontWeight: 400,
                  fontStyle: "normal",
                  lineHeight: 1.05,
                  color: "var(--color-text-primary)",
                  marginBottom: "32px",
                  letterSpacing: "-0.02em",
                  textWrap: "balance",
                }}
              >
                Elevating Local Brands to a Global Stage.
              </h1>
            </FadeIn>

            <FadeIn delay={0.35} duration={0.7} y={20}>
              <p
                style={{
                  fontSize: "18px",
                  lineHeight: 1.6,
                  color: "var(--color-text-secondary)",
                  marginBottom: "48px",
                  maxWidth: "700px",
                  textWrap: "pretty",
                  margin: "0 auto 48px"
                }}
              >
                A premier digital multi-complex connecting you with the finest homegrown brands and local artisans. From fashion to gifts and decor—experience seamless shopping designed for you.
              </p>
            </FadeIn>

            {/* pill-shaped primary CTA */}
            <FadeIn delay={0.55} duration={0.6} y={16}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>
                <TrackedLink
                  eventName="hero_cta_click"
                  href="/products"
                  className="btn btn-primary btn-premium"
                  style={{ padding: "20px 56px", fontSize: "15px", letterSpacing: "0.15em", borderRadius: "100px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
                >
                  EXPLORE THE COLLECTIONS &rarr;
                </TrackedLink>

                <div 
                  style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: "32px", 
                    padding: "24px 32px",
                    background: "var(--color-surface)",
                    borderRadius: "16px",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                    <span style={{ fontSize: "20px", color: "var(--color-accent)" }}>✦</span>
                    0% Platform Fees
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                    <span style={{ fontSize: "20px", color: "var(--color-accent)" }}>✦</span>
                    Curated Local Stores
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                    <span style={{ fontSize: "20px", color: "var(--color-accent)" }}>✦</span>
                    Free Delivery
                  </div>
                </div>
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

        {/* ── OUR STORY ── */}
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
            <FadeIn>
              <div>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    marginBottom: "16px",
                  }}
                >
                  Our Story
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(32px, 4vw, 48px)",
                    fontWeight: 400,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.15,
                    marginBottom: "24px",
                    textWrap: "balance",
                  }}
                >
                  Elevating Local Stores to a Global Stage.
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.7,
                    color: "var(--color-text-secondary)",
                    marginBottom: "32px",
                    textWrap: "pretty",
                  }}
                >
                  GVSwift was born from a simple idea: homegrown brands and local stores 
                  deserve a platform to expand their business online without the burden of 
                  exorbitant fees. We operate as a zero-markup, zero-fee multi-complex platform.
                  <br /><br />
                  This means you get authentic products directly from the creators at their 
                  true value, while local businesses keep what they earn. Discover fashion, 
                  accessories, and decor that tell a story.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Image
                  src="/structured_wool_blazer.png"
                  alt="Our Story - Local Craftsmanship"
                  fill
                  sizes="(max-width: 767px) 90vw, 45vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── EXPLORE OUR STORE ── */}
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
              padding: "88px 24px",
            }}
          >
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--color-text-secondary)",
                    marginBottom: "12px",
                  }}
                >
                  Curated Selections
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(30px, 3.5vw, 42px)",
                    fontWeight: 400,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Explore Our Store
                </h2>
              </div>
            </FadeIn>

            <StaggerContainer
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "24px",
              }}
            >
              {[
                { name: "Women", slug: "women", img: "/silks_satins.png" },
                { name: "Men", slug: "men", img: "/fashion_product_mockup.png" },
                { name: "Accessories", slug: "accessories", img: "/accessory_suite.png" },
                { name: "Gifts & Decor", slug: "gifts-decor", img: "/premium_footwear.png" },
              ].map((cat) => (
                <StaggerChild key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} style={{ textDecoration: "none" }}>
                    <div
                      className="hover-lift"
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        overflow: "hidden",
                        height: "320px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                      }}
                    >
                      <Image
                        src={cat.img}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 767px) 90vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                      {/* Dark gradient overlay for text readability */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "24px",
                          left: "24px",
                          right: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "24px",
                            fontWeight: 400,
                            color: "#ffffff",
                            margin: 0,
                          }}
                        >
                          {cat.name}
                        </h3>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.2)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                          }}
                        >
                          &rarr;
                        </div>
                      </div>
                    </div>
                  </Link>
                </StaggerChild>
              ))}
            </StaggerContainer>
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