import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
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
  }  return (
    <div className="homepage-wrapper bg-default min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* ── HERO SECTION ────────────────────────────────────────────────── */}
        <section className="relative min-h-[85vh] flex items-center pt-24 pb-32 px-margin-mobile md:px-margin-desktop overflow-hidden max-w-container-max mx-auto">
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            {/* Text Content */}
            <div className="md:col-span-5 z-10 flex flex-col items-start fade-in-up visible">
              <span className="font-semibold text-accent uppercase tracking-widest text-xs mb-6 block" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em" }}>
                Introducing
              </span>
              <h1 className="text-3xl md:text-3xl text-primary mb-8" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 400, lineHeight: 1.15 }}>
                The New Standard
              </h1>
              <p className="text-base text-secondary mb-12 max-w-md" style={{ lineHeight: "1.7" }}>
                A masterclass in modern heritage. Uncompromising Visakhapatnam craftsmanship meets minimalist architecture for the discerning few.
              </p>
              <Link href="/products" className="btn btn-primary btn-premium" style={{ padding: "12px 36px" }}>
                Explore Collection
              </Link>
            </div>

            {/* Hero Image */}
            <div className="md:col-span-7 relative h-[50vh] md:h-[70vh] w-full rounded-lg overflow-hidden group hover-lift border border-border">
              <Image
                src="/silks_satins.png"
                alt="Silks & Satins Premium Textures"
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── PRODUCT BENTO GRID: THE AUTUMN EDIT ──────────────────────────── */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-default border-t border-b border-border">
          <div className="max-w-container-max mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
              <div>
                <span className="font-semibold text-accent uppercase tracking-widest text-xs mb-4 block" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}>
                  Curated Selection
                </span>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontStyle: "italic", fontWeight: 400, color: "var(--color-primary)" }}>
                  The Autumn Edit
                </h2>
              </div>
              <Link href="/products" className="hidden md:inline-flex items-center gap-2 font-semibold text-xs text-accent uppercase tracking-widest nav-link-hover" style={{ paddingBottom: "4px" }}>
                View All &rarr;
              </Link>
            </div>

            {/* Bento Grid */}
            <div className="autumn-edit-grid">
              {/* Featured Product 1 (Large Card - col-span-8 equivalent) */}
              <div className="relative rounded-lg overflow-hidden group hover-lift border border-border aspect-[16/10] min-h-[400px]">
                <Image
                  src="/structured_wool_blazer.png"
                  alt="The Heritage Overcoat"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="glass-panel p-6 rounded-md w-full max-w-sm" style={{ border: "1px solid rgba(238, 223, 219, 0.4)" }}>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
                      The Heritage Overcoat
                    </h3>
                    <p className="text-xs text-secondary mb-4">Wine Red Cashmere Blend</p>
                    <Link href="/products" className="btn btn-secondary" style={{ width: "100%", padding: "8px 16px", minHeight: "38px" }}>
                      Discover
                    </Link>
                  </div>
                </div>
              </div>

              {/* Product 2 (Small Card - col-span-4 equivalent) */}
              <div className="relative rounded-lg overflow-hidden group hover-lift border border-border bg-surface aspect-[10/10] min-h-[400px] flex flex-col p-8 justify-between">
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "24px", color: "var(--color-text-primary)", marginBottom: "2px" }}>
                    Architect Briefcase
                  </h3>
                  <p className="text-xs text-secondary">Structured Leather</p>
                </div>
                
                <div className="relative flex-grow my-6 rounded-md overflow-hidden aspect-video bg-default border border-border/40">
                  <Image
                    src="/accessory_suite.png"
                    alt="Architect Briefcase"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg text-primary">₹1,03,500</span>
                  <Link href="/products" className="btn btn-primary" style={{ padding: "8px 20px", minHeight: "38px", borderRadius: "20px" }}>
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EDITORIAL FEATURE / QUOTE SECTION ───────────────────────────── */}
        <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 fade-in-up visible">
              <div className="bg-surface p-12 rounded-lg border border-border relative">
                <span className="absolute -top-10 -left-6 z-0 select-none opacity-10 text-[120px] font-serif color-primary">“</span>
                <div className="relative z-10">
                  <p className="text-xl text-primary italic mb-8" style={{ fontFamily: "var(--font-heading)", lineHeight: "1.5" }}>
                    &quot;GVSwift redefines the boundary between accessory and architecture. Each piece is a masterclass in intentional design, meant to be inherited, not replaced.&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-[1px] bg-primary" />
                    <span className="font-semibold text-xs tracking-widest text-primary uppercase" style={{ fontFamily: "var(--font-body)" }}>
                      The Artisan Journal
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2 h-[400px] rounded-lg overflow-hidden relative border border-border">
              <Image
                src="/premium_footwear.png"
                alt="Artisan Craftsmanship Detail"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── TRENDING NOW (DOCKABLE FEATURED PRODUCTS) ───────────────────── */}
        <section className="pb-24 px-margin-mobile md:px-margin-desktop bg-default border-t border-border">
          <div className="max-w-container-max mx-auto pt-16">
            <div className="flex justify-between items-center mb-12">
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontStyle: "italic", fontWeight: 400, color: "var(--color-primary)" }}>
                Trending Now
              </h2>
              <Link href="/products" className="font-semibold text-xs text-accent uppercase tracking-widest nav-link-hover" style={{ paddingBottom: "4px" }}>
                BROWSE ALL
              </Link>
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p className="text-secondary">Products coming soon. Check back shortly!</p>
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
      </main>

      {/* Footer */}
      <div style={{ marginTop: "auto" }}>
        <footer style={{ borderTop: "1px solid var(--color-border)" }} />
      </div>
    </div>
  );
}
