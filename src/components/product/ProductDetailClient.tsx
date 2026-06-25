"use client";

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
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id || ""
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    const currentCtaRef = ctaRef.current;
    if (currentCtaRef) {
      observer.observe(currentCtaRef);
    }

    return () => {
      if (currentCtaRef) {
        observer.unobserve(currentCtaRef);
      }
    };
  }, []);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    };

    const setCookie = (name: string, value: string, days: number = 30) => {
      if (typeof document === 'undefined') return;
      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
    };

    const addRecentlyViewed = (productId: string) => {
      const current = getCookie("recently_viewed");
      let ids: string[] = [];
      if (current) {
        ids = current.split(",").filter(Boolean);
      }
      ids = ids.filter(id => id !== productId);
      ids.unshift(productId);
      ids = ids.slice(0, 8); // Store last 8 items
      setCookie("recently_viewed", ids.join(","), 30);
    };

    addRecentlyViewed(product.id);
  }, [product.id]);

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
          .sticky-bottom-bar {
            display: none !important;
          }
        }
      `}} />

      {/* Back to Products navigation */}
      <div className="back-link-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px 0" }}>
        <Link
          href="/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--color-primary)",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
          className="nav-link-hover"
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

      <main className="detail-grid products-main max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        {/* ── Desktop Image Column (Hidden on mobile to save vertical space) ── */}
        <div className="desktop-image-column relative rounded-lg overflow-hidden border border-border aspect-[3/4]" style={{ height: "650px" }}>
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            className="object-cover"
            priority
          />
          {isOutOfStock && (
            <span className="badge-premium" style={{ position: "absolute", top: "20px", left: "20px", backgroundColor: "var(--color-error)", color: "#fff" }}>
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* ── Right Column: Info & Action panel ── */}
        <div className="detail-main-col flex flex-col gap-6" style={{ padding: "12px 0" }}>
          
          {/* Mobile Header: Visible on mobile, floats image beside title */}
          <div className="mobile-header items-center gap-4 bg-surface p-4 border border-border rounded-lg shadow-sm">
            <div className="relative w-16 h-20 rounded-md overflow-hidden bg-default border border-border flex-shrink-0">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
              {isOutOfStock && (
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "9px", fontWeight: "bold" }}>
                  OUT
                </span>
              )}
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "24px", color: "var(--color-primary)", fontWeight: 400, marginBottom: "4px" }}>
                {product.name}
              </h1>
              <span className="font-semibold text-lg text-primary">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* Desktop Header: Visible on desktop */}
          <div className="desktop-header">
            <span className="font-semibold text-accent uppercase tracking-widest text-xs mb-2 block" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em" }}>
              {product.category?.name || "Premium Collection"}
            </span>
            <h1 className="mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "40px", fontStyle: "italic", fontWeight: 400, color: "var(--color-primary)" }}>
              {product.name}
            </h1>
            <span className="font-semibold text-2xl text-primary" style={{ display: "block", marginBottom: "8px" }}>
              {formattedPrice}
            </span>
          </div>

          {/* Variant Selector */}
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-xs text-secondary tracking-widest uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.08em" }}>
              Select Size
            </span>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => {
                const { size } = parseVariantSku(variant.sku);
                const isSelected = variant.id === selectedVariantId;
                const isVarOutOfStock = variant.stock === 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className="transition-all duration-300 font-semibold"
                    style={{
                      border: `1px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                      backgroundColor: isSelected ? "var(--color-primary)" : "var(--color-surface)",
                      color: isSelected ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      opacity: isVarOutOfStock ? 0.35 : 1,
                      textDecoration: isVarOutOfStock ? "line-through" : "none",
                      padding: "10px 24px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      letterSpacing: "0.05em",
                      cursor: isVarOutOfStock ? "not-allowed" : "pointer",
                      minWidth: "64px",
                      textAlign: "center"
                    }}
                    disabled={isVarOutOfStock}
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
          <div className="flex items-center gap-2 py-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: isOutOfStock
                  ? "var(--color-error)"
                  : stock <= 5
                  ? "var(--color-warning)"
                  : "var(--color-success)",
              }}
            />
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider" style={{ letterSpacing: "0.05em" }}>
              {isOutOfStock
                ? "Out of stock"
                : stock <= 5
                ? `Only ${stock} units left — order soon`
                : "In Stock (Dispatching today from Visakhapatnam)"}
            </span>
          </div>

          {/* CTA Actions: Buy Now & Add to Cart */}
          <div className="cta-container flex gap-3 mt-2" ref={ctaRef}>
            <Button
              variant={isOutOfStock ? "secondary" : "primary"}
              className="btn-premium flex-1"
              style={{ minHeight: "48px" }}
              disabled={isOutOfStock}
              loading={isBuyingNow}
              onClick={handleBuyNow}
            >
              {isOutOfStock ? "Sold Out" : "Buy It Now"}
            </Button>
            <Button
              variant="secondary"
              className="btn-premium flex-1"
              style={{ minHeight: "48px" }}
              disabled={isOutOfStock}
              loading={isAddingToCart}
              onClick={handleAddToCart}
            >
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </Button>
          </div>

          {/* COD & Shipping info box */}
          <div className="info-box-premium flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-3 text-sm text-primary font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="icon-xs"
                style={{ color: "var(--color-primary)", flexShrink: 0 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Cash on Delivery (COD) available for serviceable pincodes.</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4 text-xs text-secondary leading-relaxed">
              <div>
                <strong className="text-primary uppercase tracking-wider block mb-1">Standard Shipping</strong>
                Free delivery across Andhra Pradesh in 3-5 business days.{" "}
                <Link href="/shipping" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
                  Shipping Policies
                </Link>
              </div>
              <div>
                <strong className="text-primary uppercase tracking-wider block mb-1">Conscious Returns</strong>
                Strict 7-day return window. Contact support to initiate.{" "}
                <Link href="/returns" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
                  Return Policies
                </Link>
              </div>
            </div>
          </div>

          {/* Description Section (Below fold / secondary space) */}
          <div className="border-t border-border pt-6 mt-4">
            <h2 className="font-semibold text-xs uppercase tracking-widest text-primary mb-3" style={{ fontFamily: "var(--font-body)" }}>
              Product Details
            </h2>
            <p className="text-sm text-secondary leading-relaxed" style={{ whiteSpace: "pre-line" }}>
              {product.description || "No product description provided."}
            </p>
          </div>

        </div>
      </main>

      <div style={{ maxWidth: "1200px", margin: "40px auto 48px" }} className="px-margin-mobile md:px-margin-desktop">
        <RecentlyViewed excludeProductId={product.id} />
      </div>

      {/* Sticky bottom mobile purchase bar */}
      <div
        className="sticky-bottom-bar"
        style={{
          position: "fixed",
          bottom: showStickyBar ? "0" : "-100px",
          left: 0,
          right: 0,
          backgroundColor: "rgba(252, 249, 248, 0.96)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--color-border)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 50,
          transition: "bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 -4px 20px rgba(86, 25, 34, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative", width: "44px", height: "44px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
            <Image src={imageUrl} alt={product.name} fill style={{ objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-primary)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "150px" }}>
              {product.name}
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              {formattedPrice} • Size {parseVariantSku(selectedVariant.sku).size}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant={isOutOfStock ? "secondary" : "primary"}
            disabled={isOutOfStock}
            loading={isBuyingNow}
            onClick={handleBuyNow}
            style={{ fontSize: "12px", padding: "6px 20px", height: "38px", minWidth: "110px" }}
            className="btn-premium"
          >
            {isOutOfStock ? "Sold Out" : "Buy Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
