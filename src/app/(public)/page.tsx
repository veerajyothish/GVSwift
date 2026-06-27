import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { getProducts } from "@/features/catalog/service";
import { getServerSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ui/ProductCard";

export const metadata = {
  title: "GVSwift — Shop with Confidence",
  description:
    "Premium fashion with Cash on Delivery across India. Free shipping. 7-day returns.",
};

export default async function HomePage() {
  const [session, productsResult] = await Promise.all([
    getServerSession(),
    getProducts({ limit: "8" }),
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

  return (
    <div className="homepage-wrapper">
      <Navbar />

      <main>
        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        {/* PDF p.1: left text, right large product image, cream bg, no border radius on section */}
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
              padding: "80px 24px 96px",
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr",
              gap: "72px",
              alignItems: "center",
            }}
            className="hero-grid-responsive"
          >
            {/* Left: Text block */}
            <div className="fade-in-up visible">
              {/* "INTRODUCING" eyebrow */}
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

              {/* PDF: large Garamond serif heading, not italic */}
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
                }}
              >
                The New Standard
              </h1>

              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.72,
                  color: "var(--color-text-secondary)",
                  marginBottom: "44px",
                  maxWidth: "360px",
                }}
              >
                A masterclass in modern heritage. Uncompromising craftsmanship
                meets minimalist architecture for the discerning few.
              </p>

              {/* PDF: pill-shaped dark wine CTA, uppercase small caps */}
              <Link
                href="/products"
                className="btn btn-primary btn-premium"
                style={{ padding: "14px 40px", fontSize: "12px", letterSpacing: "0.1em" }}
              >
                Explore Collection
              </Link>
            </div>

            {/* Right: Large product image — rounded corners, matches PDF */}
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
          </div>

          <style>{`
            @media (max-width: 767px) {
              .hero-grid-responsive {
                grid-template-columns: 1fr !important;
                gap: 36px !important;
                padding: 56px 20px 64px !important;
              }
            }
          `}</style>
        </section>

        {/* ── AUTUMN EDIT BENTO ─────────────────────────────────────────────── */}
        {/* PDF p.2: "CURATED SELECTION" eyebrow, "The Autumn Edit" heading, VIEW ALL right,
            large image card left with glass overlay card, small product card right */}
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
                  Curated Selection
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
                  The Autumn Edit
                </h2>
              </div>
              <Link
                href="/products"
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
                View All &rarr;
              </Link>
            </div>

            {/* Bento Grid */}
            <div className="autumn-edit-grid">
              {/* Large featured card — PDF: full bleed image, glass panel bottom-left */}
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
                  alt="The Heritage Overcoat"
                  fill
                  sizes="(max-width: 767px) 90vw, 55vw"
                  style={{ objectFit: "cover" }}
                />
                {/* Glass overlay card at bottom — matches PDF exactly */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "24px",
                    right: "24px",
                  }}
                >
                  <div
                    className="glass-panel"
                    style={{
                      padding: "20px 24px",
                      borderRadius: "14px",
                      maxWidth: "280px",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "19px",
                        fontWeight: 400,
                        color: "var(--color-text-primary)",
                        marginBottom: "4px",
                      }}
                    >
                      The Heritage Overcoat
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                        marginBottom: "16px",
                      }}
                    >
                      Wine Red Cashmere Blend
                    </p>
                    <Link
                      href="/products"
                      className="btn btn-secondary"
                      style={{
                        padding: "8px 24px",
                        minHeight: "34px",
                        fontSize: "11px",
                        letterSpacing: "0.1em",
                        width: "100%",
                      }}
                    >
                      Discover
                    </Link>
                  </div>
                </div>
              </div>

              {/* Small product card — PDF: name top, image middle, price + plus-btn bottom */}
              <div
                className="hover-lift"
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg)",
                  display: "flex",
                  flexDirection: "column",
                  padding: "28px",
                  minHeight: "460px",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "22px",
                      fontWeight: 400,
                      color: "var(--color-text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    Architect Briefcase
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    Structured Leather
                  </p>
                </div>

                {/* Product image */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4 / 3",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    margin: "24px 0",
                    flexGrow: 1,
                  }}
                >
                  <Image
                    src="/accessory_suite.png"
                    alt="Architect Briefcase"
                    fill
                    sizes="(max-width: 767px) 80vw, 35vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Price + add button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₹1,03,500
                  </span>
                  <Link
                    href="/products"
                    aria-label="Browse collection"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                  >
                    +
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EDITORIAL QUOTE ───────────────────────────────────────────────── */}
        {/* PDF p.3: large closing-quote icon top-left, italic Garamond quote left,
            close-up product image right, minimal footer below */}
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
            <div
              style={{
                background: "var(--color-surface)",
                borderRadius: "20px",
                border: "1px solid var(--color-border)",
                padding: "52px 44px",
                position: "relative",
              }}
            >
              {/* Large decorative quotemark — PDF shows it top-left, large, faint */}
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
                }}
              >
                &ldquo;GVSwift redefines the boundary between accessory and
                architecture. Each piece is a masterclass in intentional design,
                meant to be inherited, not replaced.&rdquo;
              </p>
              {/* Attribution: rule + small caps */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "1px",
                    background: "var(--color-accent)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                  }}
                >
                  The Artisan Journal
                </span>
              </div>
            </div>

            {/* Close-up texture/material image */}
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
          </div>

          <style>{`
            @media (max-width: 767px) {
              .editorial-grid-responsive {
                grid-template-columns: 1fr !important;
                gap: 32px !important;
                padding: 56px 20px !important;
              }
            }
          `}</style>
        </section>

        {/* ── TRENDING NOW ──────────────────────────────────────────────────── */}
        {/* PDF p.6/7: standard 4-col product grid with category label + name + price */}
        {products.length > 0 && (
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
                <Link
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
                </Link>
              </div>

              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    initialWishlisted={wishlistedIds.includes(product.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}