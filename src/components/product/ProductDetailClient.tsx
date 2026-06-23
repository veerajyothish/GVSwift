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
  const formattedPrice = `₹${(pricePaise / 100).toLocaleString("en-IN")}`;
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
    <div className="homepage-wrapper">
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
            className="icon-xs"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to collection
        </Link>
      </div>

      <main className="detail-grid products-main">
        {/* ── Desktop Image Column (Hidden on mobile to save vertical space) ── */}
        <div className="desktop-image-column detail-image-container">
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {isOutOfStock && (
            <span className="product-card-badge-error">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* ── Right Column: Info & Action panel ── */}
        <div className="detail-main-col">
          
          {/* Mobile Header: Visible on mobile, floats image beside title */}
          <div className="mobile-header">
            <div className="detail-thumb-mobile">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
              />
              {isOutOfStock && (
                <span className="detail-thumb-out-badge">
                  OUT
                </span>
              )}
            </div>
            <div>
              <h1 className="text-base detail-mobile-title">
                {product.name}
              </h1>
              <span className="detail-mobile-price">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* Desktop Header: Visible on desktop */}
          <div className="desktop-header">
            <h1 className="text-xl detail-desktop-title">
              {product.name}
            </h1>
            <span className="detail-desktop-price">
              {formattedPrice}
            </span>
          </div>

          {/* Variant Selector */}
          <div>
            <span className="detail-label">
              SELECT SIZE
            </span>
            <div className="detail-size-list">
              {product.variants.map((variant) => {
                const { size } = parseVariantSku(variant.sku);
                const isSelected = variant.id === selectedVariantId;
                const isVarOutOfStock = variant.stock === 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className="detail-size-btn"
                    style={{
                      border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: isSelected ? "var(--color-accent)" : "var(--color-surface)",
                      color: isSelected ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      opacity: isVarOutOfStock ? 0.4 : 1,
                      textDecoration: isVarOutOfStock ? "line-through" : "none",
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
          <div className="detail-stock-indicator">
            <span
              className="detail-stock-dot"
              style={{
                backgroundColor: isOutOfStock
                  ? "var(--color-error)"
                  : stock <= 5
                  ? "var(--color-warning)"
                  : "var(--color-success)",
              }}
            />
            <span className="text-xs font-medium footer-text-muted">
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
          <div className="detail-info-box">
            <div className="detail-info-row-flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="icon-xs"
                style={{ color: "var(--color-accent)", flexShrink: 0 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>COD available for serviceable areas</span>
            </div>
            
            <div className="detail-info-grid">
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
          <div className="detail-desc-section">
            <h2 className="text-xs font-semibold" style={{ marginBottom: "6px" }}>
              Product Details
            </h2>
            <p className="text-xs footer-text-muted" style={{ lineHeight: "1.5" }}>
              {product.description || "No product description provided."}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
