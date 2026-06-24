import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
import { getProducts } from "@/features/catalog/service";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ui/ProductCard";

export const metadata = {
  title: "GVSwift — Shop with Confidence",
  description:
    "Premium fashion with Cash on Delivery across India. Free shipping. 7-day returns.",
};

export default async function HomePage() {
  const session = await getServerSession();
  
  let isAdmin = false;
  let wishlistedIds: string[] = [];
  if (session) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: session.id },
        select: { role: true },
      });
      isAdmin = dbUser?.role === "ADMIN";
    } catch (e) {
      console.error("Failed to check admin status:", e);
    }

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

  // Preserve the existing database data fetching logic
  const productsResult = await getProducts({ limit: "8" });
  const { products } = productsResult;

  return (
    <div className="homepage-wrapper bg-default min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="hero-section" style={{ position: "relative", padding: "100px 20px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div className="hero-overlay" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle, rgba(252,249,248,0.7) 0%, rgba(252,249,248,0.95) 100%)", zIndex: 1 }} />
        
        {/* Background Image */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <Image
            src="/silks_satins.png"
            alt="Background Texture"
            fill
            style={{ objectFit: "cover", opacity: 0.15 }}
            priority
          />
        </div>

        <div className="container-lg" style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "800px" }}>
          <span className="hero-badge" style={{ color: "var(--color-primary)", letterSpacing: "0.2em", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", display: "inline-block", marginBottom: "16px" }}>
            Shop with Confidence
          </span>

          <h1 className="hero-title" style={{ fontFamily: "var(--font-heading)", fontSize: "56px", color: "var(--color-primary)", fontStyle: "italic", fontWeight: 400, lineHeight: 1.1, marginBottom: "24px" }}>
            Premium Fashion, <br />Delivered to Your Door
          </h1>

          <p className="hero-desc" style={{ fontSize: "16px", color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto 40px auto", lineHeight: "1.7" }}>
            Exclusive styles with Cash on Delivery across India. No prepayment required &mdash; pay when you receive your order.
          </p>

          <div className="hero-buttons" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/products" className="btn btn-primary" style={{ borderRadius: "50px", padding: "12px 36px", fontWeight: 600 }}>
              Shop Collection →
            </Link>
            {session ? (
              isAdmin ? (
                <Link href="/admin" className="btn btn-secondary" style={{ borderRadius: "50px", padding: "12px 36px" }}>
                  Admin Dashboard
                </Link>
              ) : (
                <Link href="/account" className="btn btn-secondary" style={{ borderRadius: "50px", padding: "12px 36px" }}>
                  My Account
                </Link>
              )
            ) : (
              <Link href="/signup" className="btn btn-secondary" style={{ borderRadius: "50px", padding: "12px 36px" }}>
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── THE AUTUMN EDIT ────────────────────────────────────────────────── */}
      <section className="section-container" style={{ padding: "80px 20px" }}>
        <div className="container-lg">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontStyle: "italic", fontWeight: 400, color: "var(--color-primary)" }}>
              The Autumn Edit
            </h2>
            <Link href="/products" style={{ fontSize: "13px", letterSpacing: "0.05em", color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-text-secondary)", paddingBottom: "2px" }}>
              EXPLORE ALL
            </Link>
          </div>

          {/* Grid Layout matching reference 5 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="autumn-edit-grid">
            {/* Left tall card */}
            <div className="card" style={{ position: "relative", height: "600px", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "40px", overflow: "hidden" }}>
              <Image
                src="/structured_wool_blazer.png"
                alt="Structured Wool Blazers"
                fill
                style={{ objectFit: "cover", zIndex: 0 }}
              />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(42, 12, 16, 0.8) 0%, rgba(42, 12, 16, 0) 60%)", zIndex: 1 }} />
              <div style={{ position: "relative", zIndex: 2 }}>
                <span style={{ color: "#dfd2d0", letterSpacing: "0.15em", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>HERITAGE LINE</span>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", color: "#fff", margin: "8px 0 20px 0" }}>Structured Wool Blazers</h3>
                <Link href="/products" className="btn btn-secondary" style={{ color: "#fff", borderColor: "#fff", display: "inline-flex", borderRadius: "0", minHeight: "40px", padding: "8px 24px" }}>
                  SHOP NOW
                </Link>
              </div>
            </div>

            {/* Right stacked cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="autumn-edit-sidebar">
              {/* Top card */}
              <div className="card" style={{ position: "relative", height: "288px", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "30px", overflow: "hidden" }}>
                <Image
                  src="/silks_satins.png"
                  alt="Silks & Satins"
                  fill
                  style={{ objectFit: "cover", zIndex: 0 }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(42, 12, 16, 0.7) 0%, rgba(42, 12, 16, 0) 70%)", zIndex: 1 }} />
                <div style={{ position: "relative", zIndex: 2 }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", color: "#fff", margin: 0 }}>Silks &amp; Satins</h3>
                </div>
              </div>

              {/* Bottom card */}
              <div className="card" style={{ position: "relative", height: "288px", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "30px", overflow: "hidden" }}>
                <Image
                  src="/accessory_suite.png"
                  alt="The Accessory Suite"
                  fill
                  style={{ objectFit: "cover", zIndex: 0 }}
                />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(42, 12, 16, 0.7) 0%, rgba(42, 12, 16, 0) 70%)", zIndex: 1 }} />
                <div style={{ position: "relative", zIndex: 2 }}>
                  <span style={{ color: "#dfd2d0", letterSpacing: "0.1em", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>ARTISAN LEATHER GOODS</span>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", color: "#fff", margin: "4px 0 0 0" }}>The Accessory Suite</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE SECTION ─────────────────────────────────────────────────── */}
      <section className="homepage-quote-section" style={{ padding: "100px 20px", textAlign: "center", backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span style={{ fontSize: "48px", color: "var(--color-primary)", display: "block", marginBottom: "20px", fontFamily: "var(--font-heading)", fontStyle: "italic" }}>”</span>
          <blockquote style={{ fontSize: "26px", fontStyle: "italic", fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", lineHeight: "1.5", marginBottom: "24px" }}>
            &ldquo;GVSwift isn&apos;t just about clothing; it&apos;s an architectural approach to movement and elegance. The Wine Red collection has become my signature silhouette for every gallery opening.&rdquo;
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <span style={{ height: "1px", width: "40px", backgroundColor: "var(--color-border)" }} />
            <cite style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-secondary)", fontWeight: 600, fontStyle: "normal" }}>
              ELENA MORETTI, CREATIVE DIRECTOR
            </cite>
            <span style={{ height: "1px", width: "40px", backgroundColor: "var(--color-border)" }} />
          </div>
        </div>
      </section>

      {/* ── TRENDING NOW (FEATURED COLLECTION) ────────────────────────────── */}
      <section className="section-container" style={{ padding: "80px 20px" }}>
        <div className="container-lg">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontStyle: "italic", fontWeight: 400, color: "var(--color-primary)" }}>
              Trending Now
            </h2>
            {/* Custom arrow controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="carousel-control-btn" style={{ width: "40px", height: "40px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                &lt;
              </button>
              <button className="carousel-control-btn" style={{ width: "40px", height: "40px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                &gt;
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="featured-empty" style={{ textAlign: "center", padding: "40px 0" }}>
              <p className="featured-empty-text">Products coming soon. Check back shortly!</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  initialWishlisted={wishlistedIds.includes(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Inline styles for custom grid responsive behaviour */}
      <style>{`
        @media (min-width: 768px) {
          .autumn-edit-grid {
            grid-template-columns: 1.5fr 1fr !important;
          }
        }
      `}</style>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="bottom-cta-section" style={{ padding: "80px 20px", textAlign: "center", backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}>
        <h2 className="bottom-cta-title" style={{ fontFamily: "var(--font-heading)", fontSize: "36px", color: "var(--color-primary)", marginBottom: "16px" }}>
          Ready to Shop?
        </h2>
        <p className="bottom-cta-desc" style={{ fontSize: "15px", color: "var(--color-text-secondary)", maxWidth: "500px", margin: "0 auto 32px auto", lineHeight: "1.6" }}>
          {session
            ? "Explore the full collection and manage your orders instantly from your dashboard."
            : "Create a free account and start shopping the GVSwift collection today. Cash on Delivery available across India."}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {session ? (
            isAdmin ? (
              <Link href="/admin" className="btn btn-primary btn-xl" style={{ borderRadius: "50px" }}>
                Admin Dashboard
              </Link>
            ) : (
              <Link href="/account" className="btn btn-primary btn-xl" style={{ borderRadius: "50px" }}>
                My Account
              </Link>
            )
          ) : (
            <Link href="/signup" className="btn btn-primary btn-xl" style={{ borderRadius: "50px" }}>
              Create Free Account
            </Link>
          )}
          <Link href="/products" className="btn btn-secondary btn-xl" style={{ borderRadius: "50px" }}>
            Browse Products
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div style={{ marginTop: "auto" }}>
        <footer style={{ borderTop: "1px solid var(--color-border)" }} />
      </div>
    </div>
  );
}
