import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";
import { getProducts, getCategories } from "@/features/catalog/service";

export const metadata = {
  title: "GVSwift — Shop with Confidence",
  description:
    "Premium fashion with Cash on Delivery across Andhra Pradesh. Free shipping. 7-day returns.",
};

// ── Reusable stat badge ──────────────────────────────────────────────────────
function StatBadge({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 20px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        flex: "1 1 180px",
      }}
    >
      <span style={{ fontSize: "28px", lineHeight: 1 }}>{icon}</span>
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          {label}
        </div>
        <div
          style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}
        >
          {sub}
        </div>
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
    <div
      style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh", color: "var(--color-text-primary)" }}
    >
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "520px",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* Gold gradient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 60% 50%, rgba(212,169,67,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "80px 20px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* Left — copy */}
          <div style={{ maxWidth: "560px" }}>
            <span
              style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                marginBottom: "16px",
                padding: "4px 10px",
                border: "1px solid rgba(212,169,67,0.35)",
                borderRadius: "100px",
              }}
            >
              Shop with Confidence
            </span>

            <h1
              style={{
                fontFamily: "var(--font-heading), serif",
                fontSize: "clamp(36px, 6vw, 64px)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "var(--color-text-primary)",
                marginBottom: "20px",
              }}
            >
              Premium Fashion,{" "}
              <span style={{ color: "var(--color-accent)" }}>
                Delivered to Your Door
              </span>
            </h1>

            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.65,
                color: "var(--color-text-secondary)",
                marginBottom: "36px",
                maxWidth: "480px",
              }}
            >
              Exclusive styles with Cash on Delivery across Andhra Pradesh. No
              prepayment required — pay when you receive your order.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/products" className="btn btn-primary" style={{ fontSize: "15px", padding: "12px 28px" }}>
                Shop Collection →
              </Link>
              <Link href="/signup" className="btn btn-secondary" style={{ fontSize: "15px", padding: "12px 28px" }}>
                Create Account
              </Link>
            </div>
          </div>

          {/* Right — hero image / showcase card */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            className="hero-image-col"
          >
            <div
              style={{
                width: "320px",
                height: "380px",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                position: "relative",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}
            >
              <Image
                src="/fashion_product_mockup.png"
                alt="GVSwift Premium Fashion"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
              {/* Gold shimmer overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  background: "linear-gradient(0deg, rgba(11,11,12,0.7) 0%, transparent 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "20px",
                  right: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    marginBottom: "4px",
                  }}
                >
                  New Arrival
                </div>
                <div
                  style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}
                >
                  Stitch Gold Collection
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
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <StatBadge icon="💵" label="Cash on Delivery" sub="No prepayment required" />
          <StatBadge icon="🚚" label="Free Shipping" sub="On all orders" />
          <StatBadge icon="↩️" label="7-Day Returns" sub="Hassle-free returns" />
          <StatBadge icon="🛡️" label="Secure Orders" sub="4-tier risk protection" />
        </div>
      </section>

      {/* ── CATEGORY SHORTCUTS ────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px 40px",
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)", marginBottom: "20px" }}
          >
            Shop by Category
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/products"
              style={{
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                border: "1px solid var(--color-accent)",
                textDecoration: "none",
                transition: "opacity 0.2s ease",
              }}
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  textDecoration: "none",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)", margin: 0 }}
          >
            Featured Collection
          </h2>
          <Link
            href="/products"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>

        {products.length === 0 ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <p style={{ color: "var(--color-text-secondary)", fontSize: "16px" }}>
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
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card card-interactive card-product"
                    style={{ height: "100%" }}
                  >
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
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: "var(--color-error)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 7px",
                            borderRadius: "var(--radius-sm)",
                            textTransform: "uppercase",
                          }}
                        >
                          Out of Stock
                        </span>
                      ) : totalStock <= 5 ? (
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: "var(--color-warning)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 7px",
                            borderRadius: "var(--radius-sm)",
                            textTransform: "uppercase",
                          }}
                        >
                          Only {totalStock} left
                        </span>
                      ) : null}
                    </div>

                    {/* Info */}
                    <div className="card-product-content">
                      <h3
                        className="card-product-title"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {product.name}
                      </h3>
                      <span
                        className="card-product-price"
                        style={{
                          color: "var(--color-accent)",
                          display: "block",
                          marginTop: "6px",
                        }}
                      >
                        {formattedPrice}
                      </span>
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: "14px",
                        }}
                      >
                        <div
                          className="btn btn-primary"
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            opacity: isOutOfStock ? 0.5 : 1,
                            pointerEvents: "none",
                            fontSize: "13px",
                            minHeight: "38px",
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
      <section
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "64px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "40px",
            textAlign: "center",
          }}
        >
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
            <div key={step.title}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>{step.icon}</div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "8px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  maxWidth: "240px",
                  margin: "0 auto",
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading), serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "16px",
          }}
        >
          Ready to Shop?
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          Create a free account and start shopping the Stitch collection today.
          Cash on Delivery available across Andhra Pradesh.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/signup"
            className="btn btn-primary"
            style={{ fontSize: "15px", padding: "12px 32px" }}
          >
            Create Free Account
          </Link>
          <Link
            href="/products"
            className="btn btn-secondary"
            style={{ fontSize: "15px", padding: "12px 32px" }}
          >
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}
