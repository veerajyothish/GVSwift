"use client";

/**
 * ProductDetailClient — PDF p.4/5/21/22:
 * Desktop: two-col grid (large sticky image left 3:4 aspect, info right).
 * Mobile p.21/22: full-width image top, title + price below, description,
 *   colour swatches, size pills (pill-shaped), sticky "ADD TO BAG · ₹price" CTA bottom.
 * Breadcrumb: "COLLECTION › OUTERWEAR" in small caps above image.
 * Info box: scroll-icon + italic quote card (PDF p.4/5), MATERIAL DETAILS grid below,
 *   FIT & DIMENSIONS / SHIPPING & RETURNS accordion rows (PDF p.5).
 */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductWithVariantsAndImages } from "@/features/catalog/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { RecentlyViewed } from "./RecentlyViewed";

interface ProductDetailClientProps {
  product: ProductWithVariantsAndImages;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || "");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const ctaRef = React.useRef<HTMLDivElement>(null);

  /* Sticky bottom bar observer */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    const el = ctaRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  /* Recently viewed cookie */
  useEffect(() => {
    const getCookie = (name: string) => {
      const v = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
      return v ? v.pop() ?? null : null;
    };
    const setCookie = (name: string, value: string, days = 30) => {
      const exp = new Date(Date.now() + days * 86400000).toUTCString();
      document.cookie = `${name}=${value}; expires=${exp}; path=/; SameSite=Lax`;
    };
    const ids = (getCookie("recently_viewed") ?? "").split(",").filter(Boolean);
    const updated = [product.id, ...ids.filter((id) => id !== product.id)].slice(0, 8);
    setCookie("recently_viewed", updated.join(","), 30);
  }, [product.id]);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const pricePaise = product.basePricePaise + (selectedVariant?.priceDeltaPaise || 0);
  const formattedPrice = `₹${(pricePaise / 100).toLocaleString("en-IN")}`;
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock === 0;

  const parseVariantSku = (sku: string) => {
    const parts = sku.split("-");
    return { size: parts[parts.length - 1] || sku, color: parts[parts.length - 2] || "Default" };
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAddingToCart(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariant.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      toast.success(`Added ${product.name} to your cart!`, "Added to Cart");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not add item", "Error");
    } finally { setIsAddingToCart(false); }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    setIsBuyingNow(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariant.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      router.push("/checkout");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not process request", "Error");
      setIsBuyingNow(false);
    }
  };

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";

  return (
    <div style={{ background: "var(--color-bg)" }}>
      <style>{`
        .pdp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          align-items: start;
        }
        .pdp-image-col { position: sticky; top: 80px; }
        .pdp-mobile-only  { display: none; }
        .pdp-desktop-only { display: block; }
        .sticky-buy-bar   { display: none; }

        @media (max-width: 767px) {
          .pdp-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            padding: 0 0 100px !important;
          }
          .pdp-image-col    { position: static; }
          .pdp-mobile-only  { display: block; }
          .pdp-desktop-only { display: none; }
          .sticky-buy-bar   { display: flex !important; }
        }
      `}</style>

      <div className="pdp-grid">
        {/* ── IMAGE COLUMN ──────────────────────────────────────────────── */}
        <div className="pdp-image-col">
          {/* PDF p.4: large 3:4 image, rounded corners, cream bg */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 4",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Image
              src={imageUrl}
              alt={primaryImage?.altText || product.name}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
            {isOutOfStock && (
              <span
                className="badge-premium"
                style={{
                  position: "absolute", top: "16px", left: "16px",
                  background: "var(--color-error)", color: "#fff",
                  fontSize: "10px", padding: "4px 10px",
                }}
              >
                OUT OF STOCK
              </span>
            )}
          </div>

          {/* Dot pagination indicator (mobile) */}
          <div className="pdp-mobile-only" style={{ textAlign: "center", paddingTop: "12px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-border)", display: "inline-block", marginLeft: "6px" }} />
          </div>
        </div>

        {/* ── INFO COLUMN ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "0" }}>

          {/* PDF p.4 desktop: breadcrumb "COLLECTION › OUTERWEAR" */}
          <div className="pdp-desktop-only">
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
                marginBottom: "12px",
              }}
            >
              Collection
              {product.category?.name && (
                <> <span style={{ opacity: 0.5 }}>›</span> {product.category.name}</>
              )}
            </p>

            {/* Product title — PDF p.4: large Garamond serif, not italic */}
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 400,
                fontStyle: "normal",
                color: "var(--color-text-primary)",
                lineHeight: 1.1,
                marginBottom: "16px",
              }}
            >
              {product.name}
            </h1>

            {/* Price — PDF p.4: wine-red, larger */}
            <p
              style={{
                fontSize: "24px",
                fontWeight: 500,
                color: "var(--color-accent)",
                marginBottom: "20px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formattedPrice}
            </p>
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", marginBottom: "20px" }} />
          </div>

          {/* PDF p.22 mobile: name + price below image */}
          <div className="pdp-mobile-only" style={{ padding: "20px 20px 0" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "32px",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                lineHeight: 1.1,
                marginBottom: "8px",
              }}
            >
              {product.name}
            </h1>
            <p style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "16px" }}>
              {formattedPrice}
            </p>
            {product.description && (
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: "20px" }}>
                {product.description}
              </p>
            )}
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", marginBottom: "20px" }} />
          </div>

          {/* Wrapper for rest of info (mobile: padded) */}
          <div style={{ padding: "0 20px" }} className="pdp-mobile-only" />
          <div style={{ display: "contents" }}>

            {/* ── Size selector — PDF p.4/22: pill buttons ── */}
            <div style={{ padding: "0 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Size
                </span>
                <Link href="/size-guide" style={{ fontSize: "13px", color: "var(--color-accent)", textDecoration: "none" }}>
                  Fit Guide
                </Link>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {product.variants.map((variant) => {
                  const { size } = parseVariantSku(variant.sku);
                  const isSelected = variant.id === selectedVariantId;
                  const outOfStock = variant.stock === 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      disabled={outOfStock}
                      style={{
                        minWidth: "52px",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "9999px",
                        border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                        background: isSelected ? "transparent" : "transparent",
                        color: isSelected ? "var(--color-accent)" : "var(--color-text-primary)",
                        fontSize: "14px",
                        fontWeight: isSelected ? 600 : 400,
                        cursor: outOfStock ? "not-allowed" : "pointer",
                        opacity: outOfStock ? 0.35 : 1,
                        textDecoration: outOfStock ? "line-through" : "none",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 20px" }}>
              <span
                style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: isOutOfStock ? "var(--color-error)" : stock <= 5 ? "var(--color-warning)" : "var(--color-success)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", letterSpacing: "0.04em" }}>
                {isOutOfStock ? "Out of stock"
                  : stock <= 5 ? `Only ${stock} left`
                  : "In Stock — dispatching today"}
              </span>
            </div>

            {/* ── CTAs — PDF p.4: full-width pill "ADD TO BAG →" ── */}
            <div ref={ctaRef} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 20px" }}>
              <Button
                variant={isOutOfStock ? "secondary" : "primary"}
                disabled={isOutOfStock}
                loading={isBuyingNow}
                onClick={handleBuyNow}
                className="btn-premium"
                style={{ width: "100%", minHeight: "52px", fontSize: "13px", letterSpacing: "0.08em" }}
              >
                {isOutOfStock ? "Sold Out" : `Add to Bag →`}
              </Button>
              <Button
                variant="secondary"
                disabled={isOutOfStock}
                loading={isAddingToCart}
                onClick={handleAddToCart}
                className="btn-premium"
                style={{ width: "100%", minHeight: "44px", fontSize: "12px" }}
              >
                {isOutOfStock ? "Sold Out" : "Add to Cart"}
              </Button>
            </div>

            {/* ── Description quote box — PDF p.4/5: scroll icon + italic quote ── */}
            <div style={{ margin: "0 20px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
              <div style={{ marginBottom: "12px", color: "var(--color-text-secondary)", fontSize: "20px" }}>📜</div>
              {product.description ? (
                <>
                  <p
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "15px",
                      fontStyle: "italic",
                      lineHeight: 1.65,
                      color: "var(--color-text-primary)",
                      marginBottom: "12px",
                    }}
                  >
                    &ldquo;{product.description.slice(0, 180)}{product.description.length > 180 ? "…" : ""}&rdquo;
                  </p>
                  {product.description.length > 180 && (
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                      {product.description.slice(180)}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontStyle: "italic", color: "var(--color-text-secondary)" }}>
                  A study in timeless architecture. Crafted with unhurried artisanship.
                </p>
              )}
            </div>

            {/* ── Accordion rows — PDF p.5: FIT & DIMENSIONS / SHIPPING & RETURNS ── */}
            {[
              {
                id: "fit",
                label: "Fit & Dimensions",
                content: "Standard sizing. We recommend going true to size. For reference, our model wears size M and is 183cm tall.",
              },
              {
                id: "shipping",
                label: "Shipping & Returns",
                content: "Free standard delivery across India in 3–5 business days. 7-day returns accepted. Contact support to initiate.",
              },
            ].map(({ id, label, content }) => (
              <div
                key={id}
                style={{ borderTop: "1px solid var(--color-border)", margin: "0 20px" }}
              >
                <button
                  onClick={() => setOpenAccordion(openAccordion === id ? null : id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {label}
                  <span style={{ fontSize: "18px", color: "var(--color-text-secondary)", lineHeight: 1 }}>
                    {openAccordion === id ? "−" : "+"}
                  </span>
                </button>
                {openAccordion === id && (
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.65, paddingBottom: "16px" }}>
                    {content}
                  </p>
                )}
              </div>
            ))}

            {/* COD badge */}
            <div style={{ margin: "0 20px", padding: "12px 16px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", fontSize: "13px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
              ✅ <span><strong style={{ color: "var(--color-text-primary)" }}>Cash on Delivery</strong> available for serviceable pincodes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently viewed */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 56px", padding: "0 24px" }}>
        <RecentlyViewed excludeProductId={product.id} />
      </div>

      {/* ── Sticky mobile buy bar — PDF p.21: "ADD TO BAG · ₹1,250" full-width pill ── */}
      <div
        className="sticky-buy-bar"
        style={{
          position: "fixed",
          bottom: showStickyBar ? "64px" : "calc(64px - 80px)", /* sits above bottom nav */
          left: 0,
          right: 0,
          padding: "12px 20px",
          background: "rgba(253,250,245,0.97)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--color-border)",
          zIndex: 80,
          transition: "bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Button
          variant={isOutOfStock ? "secondary" : "primary"}
          disabled={isOutOfStock}
          loading={isBuyingNow}
          onClick={handleBuyNow}
          className="btn-premium"
          style={{ flex: 1, minHeight: "48px", fontSize: "12px" }}
        >
          {isOutOfStock
            ? "Sold Out"
            : `Add to Bag · ${formattedPrice}`}
        </Button>
      </div>
    </div>
  );
}