"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductWithVariantsAndImages } from "@/features/catalog/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface ProductDetailClientProps {
  product: ProductWithVariantsAndImages;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id || ""
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  const pricePaise =
    product.basePricePaise + (selectedVariant?.priceDeltaPaise || 0);
  const formattedPrice = `₹${(pricePaise / 100).toLocaleString()}`;
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock === 0;

  // Helper to parse SKU (e.g. STITCH-JKT-BLK-M -> Size: M, Color: BLK)
  const parseVariantSku = (sku: string) => {
    const parts = sku.split("-");
    const size = parts[parts.length - 1] || sku;
    const color = parts[parts.length - 2] || "Default";
    return { size, color };
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    
    setIsAddingToCart(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          quantity: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add item to cart");
      }

      toast.success(
        `Added 1x ${product.name} (${parseVariantSku(selectedVariant.sku).size}) to your cart!`,
        "Added to Cart"
      );
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not add item to cart", "Error");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    
    setIsBuyingNow(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          quantity: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add item to cart");
      }

      toast.success(
        `Added 1x ${product.name} (${parseVariantSku(selectedVariant.sku).size}) to your cart!`,
        "Buy Now"
      );
      
      router.push("/checkout");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not process Buy Now request", "Error");
    } finally {
      setIsBuyingNow(false);
    }
  };

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh", color: "var(--color-text-primary)" }}>
      {/* Responsive layout styles to force above-the-fold elements on mobile */}
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .mobile-header {
          display: none;
        }
        .desktop-header {
          display: block;
        }
        .desktop-image-column {
          display: block;
        }
        .cta-container {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        @media (max-width: 767px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            padding: 10px !important;
          }
          .mobile-header {
            display: flex !important;
            gap: 12px;
            align-items: center;
          }
          .desktop-header {
            display: none !important;
          }
          .desktop-image-column {
            display: none !important;
          }
          .back-link-container {
            padding: 10px 10px 0 !important;
          }
        }

        @media (min-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 30px !important;
          }
          .cta-container {
            flex-direction: row !important;
          }
        }
      `}} />

      {/* Back to Products navigation */}
      <div className="back-link-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px 0" }}>
        <Link
          href="/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--color-accent)",
            fontWeight: 500,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            style={{ width: "16px", height: "16px" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to collection
        </Link>
      </div>

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
        className="detail-grid"
      >
        {/* ── Desktop Image Column (Hidden on mobile to save vertical space) ── */}
        <div
          className="desktop-image-column"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            maxHeight: "500px",
          }}
        >
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {isOutOfStock && (
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
          )}
        </div>

        {/* ── Right Column: Info & Action panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* Mobile Header: Visible on mobile, floats image beside title */}
          <div className="mobile-header">
            <div
              style={{
                position: "relative",
                width: "90px",
                height: "90px",
                flexShrink: 0,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
              />
              {isOutOfStock && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(255, 92, 92, 0.9)",
                    color: "white",
                    fontSize: "8px",
                    textAlign: "center",
                    fontWeight: "bold",
                    padding: "2px 0",
                  }}
                >
                  OUT
                </span>
              )}
            </div>
            <div>
              <h1 className="text-base" style={{ fontWeight: 600, margin: "0 0 4px 0", lineHeight: "1.25" }}>
                {product.name}
              </h1>
              <span
                className="card-product-price"
                style={{ color: "var(--color-accent)", fontSize: "18px", fontWeight: 700 }}
              >
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* Desktop Header: Visible on desktop */}
          <div className="desktop-header">
            <h1 className="text-xl" style={{ fontWeight: 600, marginBottom: "4px", lineHeight: "1.3" }}>
              {product.name}
            </h1>
            <span
              className="card-product-price"
              style={{ color: "var(--color-accent)", fontSize: "22px", fontWeight: 700 }}
            >
              {formattedPrice}
            </span>
          </div>

          {/* Variant Selector */}
          <div>
            <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
              SELECT SIZE
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {product.variants.map((variant) => {
                const { size } = parseVariantSku(variant.sku);
                const isSelected = variant.id === selectedVariantId;
                const isVarOutOfStock = variant.stock === 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    style={{
                      minWidth: "38px",
                      height: "38px",
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: isSelected ? "var(--color-accent)" : "var(--color-surface)",
                      color: isSelected ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isVarOutOfStock ? 0.4 : 1,
                      textDecoration: isVarOutOfStock ? "line-through" : "none",
                      transition: "all 0.2s ease",
                    }}
                    title={isVarOutOfStock ? `${size} (Out of stock)` : size}
                    aria-label={`Size ${size}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: isOutOfStock
                  ? "var(--color-error)"
                  : stock <= 5
                  ? "var(--color-warning)"
                  : "var(--color-success)",
                display: "inline-block",
              }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {isOutOfStock
                ? "Out of stock"
                : stock <= 5
                ? `Only ${stock} units left — order soon`
                : "In Stock (Dispatching today)"}
            </span>
          </div>

          {/* CTA Actions: Buy Now & Add to Cart */}
          <div className="cta-container">
            <Button
              variant={isOutOfStock ? "secondary" : "primary"}
              style={{ flex: 1, minHeight: "44px" }}
              disabled={isOutOfStock}
              loading={isBuyingNow}
              onClick={handleBuyNow}
            >
              {isOutOfStock ? "Sold Out" : "Buy Now"}
            </Button>
            <Button
              variant="secondary"
              style={{ flex: 1, minHeight: "44px" }}
              disabled={isOutOfStock}
              loading={isAddingToCart}
              onClick={handleAddToCart}
            >
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </Button>
          </div>

          {/* COD & Shipping above-the-fold compact boxes */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "10px",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 500 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{ width: "14px", height: "14px", color: "var(--color-accent)", flexShrink: 0 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>COD available for serviceable areas</span>
            </div>
            
            <div
              style={{
                borderTop: "1px solid var(--color-border)",
                paddingTop: "6px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                fontSize: "11px",
                color: "var(--color-text-secondary)",
              }}
            >
              <div>
                <strong>Shipping:</strong> Standard 3-5 days.{" "}
                <Link href="/shipping" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                  Learn more
                </Link>
              </div>
              <div>
                <strong>Returns:</strong> Strict 7 days.{" "}
                <Link href="/returns" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                  Learn more
                </Link>
              </div>
            </div>
          </div>

          {/* Description Section (Below fold / secondary space) */}
          <div style={{ marginTop: "6px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
            <h2 className="text-xs font-semibold" style={{ marginBottom: "6px" }}>
              Product Details
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              {product.description || "No product description provided."}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
