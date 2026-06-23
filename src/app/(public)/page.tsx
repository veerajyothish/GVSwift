import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
import { getProducts, getCategories } from "@/features/catalog/service";

export const metadata = {
  title: "GVSwift — Shop with Confidence",
  description:
    "Premium fashion with Cash on Delivery across India. Free shipping. 7-day returns.",
};

// ── Reusable stat badge ──────────────────────────────────────────────────────
function StatBadge({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="stat-badge">
      <span className="stat-badge-icon">{icon}</span>
      <div>
        <div className="stat-badge-label">{label}</div>
        <div className="stat-badge-sub">{sub}</div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  // Fetch up to 8 featured products and all categories in parallel
  const [productsResult, categories] = await Promise.all([
    getProducts({ limit: "8" }),
    getCategories(),
  ]);

  const { products } = productsResult;

  return (
    <div className="homepage-wrapper">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        {/* Wine red/cream gradient background */}
        <div className="hero-overlay" />

        <div className="hero-container hero-grid">
          {/* Left — copy */}
          <div>
            <span className="hero-badge">
              Shop with Confidence
            </span>

            <h1 className="hero-title">
              Premium Fashion,{" "}
              <span style={{ color: "var(--color-accent)" }}>
                Delivered to Your Door
              </span>
            </h1>

            <p className="hero-desc">
              Exclusive styles with Cash on Delivery across India. No
              prepayment required — pay when you receive your order.
            </p>

            <div className="hero-buttons">
              <Link href="/products" className="btn btn-primary btn-lg">
                Shop Collection →
              </Link>
              <Link href="/signup" className="btn btn-secondary btn-lg">
                Create Account
              </Link>
            </div>
          </div>

          {/* Right — hero image / showcase card */}
          <div className="hero-image-col">
            <div className="hero-image-card">
              <Image
                src="/fashion_product_mockup.png"
                alt="GVSwift Premium Fashion"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
              {/* Shimmer overlay */}
              <div className="hero-shimmer" />
              <div className="hero-shimmer-content">
                <div className="hero-shimmer-tag">
                  New Arrival
                </div>
                <div className="hero-shimmer-title">
                  Vintage Reserve Collection
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (min-width: 768px) {
            .hero-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 767px) {
            .hero-image-col { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── TRUST BADGES ──────────────────────────────────────────────────── */}
      <section className="section-container">
        <div className="flex gap-4 flex-wrap">
          <StatBadge icon="💵" label="Cash on Delivery" sub="No prepayment required" />
          <StatBadge icon="🚚" label="Free Shipping" sub="On all orders" />
          <StatBadge icon="↩️" label="7-Day Returns" sub="Hassle-free returns" />
          <StatBadge icon="🛡️" label="Secure Orders" sub="4-tier risk protection" />
        </div>
      </section>

      {/* ── CATEGORY SHORTCUTS ────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="section-container-small">
          <h2 className="text-xl font-semibold section-title">
            Shop by Category
          </h2>
          <div className="category-list">
            <Link href="/products" className="category-link-active">
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="category-link"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <section className="section-container-small pb-64">
        <div className="featured-header">
          <h2 className="text-xl font-semibold section-title margin-0">
            Featured Collection
          </h2>
          <Link href="/products" className="featured-view-all">
            View all →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="featured-empty">
            <p className="featured-empty-text">
              Products coming soon. Check back shortly!
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const primaryImage =
                product.images.find((img) => img.isPrimary) || product.images[0];
              const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";
              const totalStock = product.variants.reduce(
                (acc, v) => acc + v.stock,
                0
              );
              const isOutOfStock = totalStock === 0;
              const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="product-card-link"
                >
                  <div className="card card-interactive card-product">
                    {/* Image */}
                    <div
                      className="card-product-image-container"
                      style={{ opacity: isOutOfStock ? 0.65 : 1 }}
                    >
                      <Image
                        src={imageUrl}
                        alt={primaryImage?.altText || product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        style={{ objectFit: "cover" }}
                        className="card-product-image"
                      />
                      {isOutOfStock ? (
                        <span className="product-card-badge-error">
                          Out of Stock
                        </span>
                      ) : totalStock <= 5 ? (
                        <span className="product-card-badge-warning">
                          Only {totalStock} left
                        </span>
                      ) : null}
                    </div>

                    {/* Info */}
                    <div className="card-product-content">
                      <h3 className="card-product-title">
                        {product.name}
                      </h3>
                      <span className="card-product-price">
                        {formattedPrice}
                      </span>
                      <div className="product-card-btn-container">
                        <div
                          className="btn btn-primary product-card-btn"
                          style={{
                            opacity: isOutOfStock ? 0.5 : 1,
                            pointerEvents: "none",
                          }}
                        >
                          {isOutOfStock ? "Out of Stock" : "Select Options"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── COD EXPLAINER ─────────────────────────────────────────────────── */}
      <section className="cod-explainer-section">
        <div className="cod-explainer-grid">
          {[
            {
              icon: "🛒",
              title: "Add to Cart",
              desc: "Browse and select your items. No prepayment needed to start shopping.",
            },
            {
              icon: "📍",
              title: "Enter Address",
              desc: "We verify your pincode in real-time to confirm COD availability.",
            },
            {
              icon: "📦",
              title: "We Dispatch",
              desc: "Orders confirmed within 24 hours and dispatched in 1–2 business days.",
            },
            {
              icon: "💵",
              title: "Pay on Delivery",
              desc: "Hand cash to the courier at your doorstep. Simple and safe.",
            },
          ].map((step) => (
            <div key={step.title} className="cod-explainer-item">
              <div className="cod-explainer-icon">{step.icon}</div>
              <h3 className="cod-explainer-title">
                {step.title}
              </h3>
              <p className="cod-explainer-desc">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="bottom-cta-section">
        <h2 className="bottom-cta-title">
          Ready to Shop?
        </h2>
        <p className="bottom-cta-desc">
          Create a free account and start shopping the Stitch collection today.
          Cash on Delivery available across India.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/signup" className="btn btn-primary btn-xl">
            Create Free Account
          </Link>
          <Link href="/products" className="btn btn-secondary btn-xl">
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}
