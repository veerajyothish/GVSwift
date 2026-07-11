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
import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductWithVariantsAndImages } from "@/features/catalog/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { RecentlyViewed } from "./RecentlyViewed";
import WishlistToggle from "./WishlistToggle";
import {
  getProductReviews,
  checkUserStatusForReview,
  submitProductReview,
  ReviewWithUser
} from "@/lib/reviews";

interface ProductDetailClientProps {
  product: ProductWithVariantsAndImages;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Reviews state
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [userStatus, setUserStatus] = useState<{ isLoggedIn: boolean; hasPurchased: boolean }>({
    isLoggedIn: false,
    hasPurchased: false,
  });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    let active = true;

    async function loadReviewsData() {
      try {
        setLoadingReviews(true);
        const [fetchedReviews, status] = await Promise.all([
          getProductReviews(product.id),
          checkUserStatusForReview(product.id),
        ]);
        if (active) {
          setReviews(fetchedReviews);
          setUserStatus(status);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (active) {
          setLoadingReviews(false);
        }
      }
    }

    loadReviewsData();
    return () => {
      active = false;
    };
  }, [product?.id]);

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  // Safe initial selected variant
  const initialVariantId = product?.variants?.[0]?.id || "";
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<"chart" | "advisor">("chart");
  const [userHeight, setUserHeight] = useState(170); // in cm
  const [userWeight, setUserWeight] = useState(65); // in kg
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
    if (!product?.id) return;
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const v = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
      return v ? v.pop() ?? null : null;
    };
    const setCookie = (name: string, value: string, days = 30) => {
      if (typeof document === "undefined") return;
      const exp = new Date(Date.now() + days * 86400000).toUTCString();
      document.cookie = `${name}=${value}; expires=${exp}; path=/; SameSite=Lax`;
    };
    const ids = (getCookie("recently_viewed") ?? "").split(",").filter(Boolean);
    const updated = [product.id, ...ids.filter((id) => id !== product.id)].slice(0, 8);
    setCookie("recently_viewed", updated.join(","), 30);
  }, [product?.id]);

  const variants = product?.variants || [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const pricePaise = (product?.basePricePaise ?? 0) + (selectedVariant?.priceDeltaPaise || 0);
  const formattedPrice = `₹${(pricePaise / 100).toLocaleString("en-IN")}`;
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = stock === 0;

  const parseVariantSku = (sku: string) => {
    if (!sku) return { size: "Default", color: "Default" };
    const parts = sku.split("-");
    return { size: parts[parts.length - 1] || sku, color: parts[parts.length - 2] || "Default" };
  };
 
  const getRecommendedSize = (height: number, weight: number): string => {
    if (weight < 52) return "S";
    if (weight >= 52 && weight < 66) return height < 172 ? "S" : "M";
    if (weight >= 66 && weight < 78) return height < 176 ? "M" : "L";
    if (weight >= 78 && weight < 90) return height < 180 ? "L" : "XL";
    return "XXL";
  };
  const recommendedSize = getRecommendedSize(userHeight, userWeight);
 
  const handleSelectRecommendedSize = () => {
    const matchingVariant = product.variants.find((v) => {
      const { size } = parseVariantSku(v.sku);
      return size.toUpperCase() === recommendedSize.toUpperCase() && v.stock > 0;
    });
 
    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
      toast.success("Recommended size selected!");
    } else {
      const matchingVariantAnyStock = product.variants.find((v) => {
        const { size } = parseVariantSku(v.sku);
        return size.toUpperCase() === recommendedSize.toUpperCase();
      });
      if (matchingVariantAnyStock) {
        setSelectedVariantId(matchingVariantAnyStock.id);
        toast.info("Recommended size selected (Out of stock)");
      } else {
        toast.error(`Size ${recommendedSize} is not available for this product`);
      }
    }
    setIsSizeGuideOpen(false);
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || !product?.id || !selectedVariant?.id) return;
    setIsAddingToCart(true);
    setIsAdded(true);
    
    // Optimistic cart count increment
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gvswift-cart-add-one"));
    }

    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariant.id, quantity: 1 }),
      });
      if (res.status === 401) {
        toast.error("Please sign in to add items to your cart.", "Sign in required");
        // Revert optimistic update
        setIsAdded(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("gvswift-cart-remove-one"));
        }
        setTimeout(() => {
          startTransition(() => {
            router.push(`/login?redirect=/products/${product.slug}`);
          });
        }, 1200);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      
      toast.success(`Added ${product.name || "item"} to your cart!`, "Added to Cart");

      // ponytail: dispatch fly-to-cart animation event
      const primaryImg = product.images?.find((img) => img.isPrimary) || product.images?.[0];
      if (primaryImg?.url) {
        window.dispatchEvent(new CustomEvent("gvswift-cart-fly", { detail: primaryImg.url }));
      }
      
      // Fetch latest cart count to synchronize precisely
      fetch("/api/v1/cart")
        .then((r) => r.json())
        .then((cartData) => {
          if (cartData && Array.isArray(cartData.items)) {
            const count = cartData.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
            window.dispatchEvent(new CustomEvent("gvswift-cart-updated", { detail: count }));
          }
        })
        .catch(() => {});

      // Keep success state visible for 2 seconds
      setTimeout(() => setIsAdded(false), 2000);

    } catch (err: unknown) {
      setIsAdded(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("gvswift-cart-remove-one"));
      }
      toast.error((err as Error).message || "Could not add item", "Error");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || !product?.id || !selectedVariant?.id) return;
    setIsBuyingNow(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariant.id, quantity: 1 }),
      });
      if (res.status === 401) {
        toast.error("Please sign in to continue to checkout.", "Sign in required");
        setTimeout(() => {
          startTransition(() => {
            router.push(`/login?redirect=/products/${product.slug}`);
          });
        }, 1200);
        setIsBuyingNow(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");

      // Optimistic cart count increment
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("gvswift-cart-add-one"));
      }

      window.location.href = "/checkout";
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not process request", "Error");
      setIsBuyingNow(false);
    }
  };

  const images = product?.images || [];

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
          {/* Image Gallery Carousel */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 4",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              touchAction: "pan-y",
              cursor: images.length > 1 ? "grab" : "default",
            }}
            onTouchStart={(e) => {
              (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const startX = Number((e.currentTarget as HTMLElement).dataset.touchX || 0);
              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && activeImageIdx < images.length - 1) {
                  setActiveImageIdx((i) => i + 1);
                } else if (diff < 0 && activeImageIdx > 0) {
                  setActiveImageIdx((i) => i - 1);
                }
              }
            }}
          >
            {/* All images stacked, only active one visible via translateX */}
            <div
              style={{
                display: "flex",
                width: `${images.length * 100}%`,
                height: "100%",
                transform: `translateX(-${activeImageIdx * (100 / images.length)}%)`,
                transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {(images.length > 0 ? images : [{ url: "/fashion_product_mockup.png", altText: product?.name, isPrimary: true, id: "fallback" }]).map((img) => (
                <div key={img.id || img.url} style={{ width: `${100 / Math.max(images.length, 1)}%`, height: "100%", position: "relative", flexShrink: 0 }}>
                  <Image
                    src={img.url}
                    alt={img.altText || product?.name || "Product Image"}
                    fill
                    priority={img.isPrimary}
                    sizes="(max-width: 767px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>

            {/* Left/Right arrows (desktop, hidden on mobile) */}
            {images.length > 1 && (
              <>
                <button
                  aria-label="Previous image"
                  onClick={() => setActiveImageIdx((i) => Math.max(0, i - 1))}
                  className="pdp-desktop-only"
                  style={{
                    position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)",
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "rgba(253,250,245,0.85)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(107,30,46,0.1)", cursor: "pointer",
                    display: activeImageIdx === 0 ? "none" : "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "var(--color-accent)", fontSize: "18px", zIndex: 5,
                  }}
                >
                  ‹
                </button>
                <button
                  aria-label="Next image"
                  onClick={() => setActiveImageIdx((i) => Math.min(images.length - 1, i + 1))}
                  className="pdp-desktop-only"
                  style={{
                    position: "absolute", top: "50%", right: "12px", transform: "translateY(-50%)",
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "rgba(253,250,245,0.85)", backdropFilter: "blur(8px)",
                    border: "1px solid rgba(107,30,46,0.1)", cursor: "pointer",
                    display: activeImageIdx === images.length - 1 ? "none" : "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "var(--color-accent)", fontSize: "18px", zIndex: 5,
                  }}
                >
                  ›
                </button>
              </>
            )}

            {/* Image counter badge */}
            {images.length > 1 && (
              <span
                style={{
                  position: "absolute", bottom: "12px", right: "12px",
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                  color: "#fff", fontSize: "11px", fontWeight: 600,
                  padding: "4px 10px", borderRadius: "999px",
                  fontVariantNumeric: "tabular-nums", zIndex: 5,
                }}
              >
                {activeImageIdx + 1} / {images.length}
              </span>
            )}

            {/* Wishlist Heart Overlay */}
            <WishlistToggle
              productId={product.id}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10,
              }}
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

          {/* Dot indicators (mobile) */}
          {images.length > 1 && (
            <div className="pdp-mobile-only" style={{ textAlign: "center", paddingTop: "12px", display: "flex", justifyContent: "center", gap: "6px" }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setActiveImageIdx(i)}
                  style={{
                    width: i === activeImageIdx ? "18px" : "6px",
                    height: "6px",
                    borderRadius: "999px",
                    background: i === activeImageIdx ? "var(--color-accent)" : "var(--color-border)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.25s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Thumbnail strip (desktop) */}
          {images.length > 1 && (
            <div className="pdp-desktop-only" style={{ display: "flex", gap: "8px", marginTop: "12px", overflowX: "auto" }}>
              {images.map((img, i) => (
                <button
                  key={img.id || img.url}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setActiveImageIdx(i)}
                  style={{
                    width: "64px", height: "80px", flexShrink: 0, position: "relative",
                    borderRadius: "var(--radius-md)", overflow: "hidden", cursor: "pointer",
                    border: i === activeImageIdx ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                    opacity: i === activeImageIdx ? 1 : 0.6,
                    transition: "all 0.2s ease",
                    padding: 0, background: "var(--color-surface)",
                  }}
                >
                  <Image
                    src={img.url}
                    alt={img.altText || `Thumbnail ${i + 1}`}
                    fill
                    sizes="64px"
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
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
              {product?.category?.name && (
                <> <span style={{ opacity: 0.5 }}>›</span> {product.category.name}</>
              )}
            </p>

            {product?.brand && (
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  marginBottom: "8px",
                }}
              >
                {product.brand}
              </span>
            )}

            {product?.shop && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Sold by</span>
                <Link
                  href={`/shops/${product.shop.slug}`}
                  style={{
                    color: "var(--color-accent)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  {product.shop.name}
                </Link>
              </div>
            )}

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
              {product?.name}
            </h1>

            {/* Price — PDF p.4: wine-red, larger */}
            <p
              className="pdp-price"
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
            {product?.brand && (
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  marginBottom: "4px",
                }}
              >
                {product.brand}
              </span>
            )}

            {product?.shop && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Sold by</span>
                <Link
                  href={`/shops/${product.shop.slug}`}
                  style={{
                    color: "var(--color-accent)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  {product.shop.name}
                </Link>
              </div>
            )}
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
              {product?.name}
            </h1>
            <p className="pdp-price" style={{ fontSize: "18px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "16px" }}>
              {formattedPrice}
            </p>
            {product?.description && (
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
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "var(--color-accent)",
                    textDecoration: "underline",
                  }}
                >
                  Fit Guide
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {variants.map((variant) => {
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
                        background: "transparent",
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
                disabled={isOutOfStock || !selectedVariant || isPending}
                loading={isBuyingNow || isPending}
                onClick={handleBuyNow}
                className="btn-premium"
                style={{ width: "100%", minHeight: "52px", fontSize: "13px", letterSpacing: "0.08em" }}
              >
                {isOutOfStock ? "Sold Out" : `Buy Now →`}
              </Button>
              <Button
                variant="secondary"
                disabled={isOutOfStock || !selectedVariant || isPending}
                loading={isAddingToCart}
                onClick={handleAddToCart}
                className="btn-premium"
                style={{
                  width: "100%",
                  minHeight: "44px",
                  fontSize: "12px",
                  backgroundColor: isAdded ? "var(--color-success)" : undefined,
                  borderColor: isAdded ? "var(--color-success)" : undefined,
                  color: isAdded ? "#fff" : undefined,
                  transition: "background-color 0.2s, border-color 0.2s",
                }}
              >
                {isOutOfStock ? "Sold Out" : isAdded ? "Added ✓" : "Add to Cart"}
              </Button>
            </div>

            {/* ── Description quote box — PDF p.4/5: scroll icon + italic quote ── */}
            <div style={{ margin: "0 20px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
              <div style={{ marginBottom: "12px", color: "var(--color-text-secondary)", fontSize: "20px" }}>📜</div>
              {product?.description ? (
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

      {/* ── Reviews section ── */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px 80px",
          borderTop: "1px solid var(--color-border)",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(24px, 3.5vw, 36px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-text-primary)",
            marginBottom: "32px",
          }}
        >
          Customer Reviews
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "48px" }} className="reviews-grid-responsive">
          {/* Summary section (Left) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "48px", fontWeight: 700, color: "var(--color-text-primary)", display: "block", fontFamily: "var(--font-heading)" }}>
                {reviewCount > 0 ? avgRating.toFixed(1) : "0.0"}
              </span>
              <div style={{ display: "flex", justifyContent: "center", gap: "2px", margin: "8px 0", fontSize: "20px" }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const fill = i < Math.round(avgRating);
                  return (
                    <span key={i} style={{ color: "var(--color-accent)" }}>
                      {fill ? "★" : "☆"}
                    </span>
                  );
                })}
              </div>
              <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>

            {/* Review form authorization messages */}
            <div style={{ marginTop: "16px" }}>
              {!userStatus.isLoggedIn ? (
                <div style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", textAlign: "center" }}>
                  <Link
                    href={`/login?redirectTo=/products/${product.slug}`}
                    style={{
                      color: "var(--color-accent)",
                      textDecoration: "underline",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Login to leave a review
                  </Link>
                </div>
              ) : !userStatus.hasPurchased ? (
                <div style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", textAlign: "center", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                  Purchase this product to leave a review
                </div>
              ) : (
                /* Star Selector Form */
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (submittingReview || !product?.id) return;
                    setSubmittingReview(true);
                    try {
                      const res = await submitProductReview(product.id, ratingInput, commentInput);
                      if (res.success) {
                        toast.success("Review submitted successfully! Thank you for your feedback.", "Review Submitted");
                        // Optimistic UI updates
                        const newReview: ReviewWithUser = {
                          id: Math.random().toString(),
                          rating: ratingInput,
                          comment: commentInput.trim() || null,
                          createdAt: new Date(),
                          user: {
                            name: "You",
                            email: "",
                          },
                        };
                        setReviews((prev) => {
                          const filtered = prev.filter((r) => r.user.name !== "You");
                          return [newReview, ...filtered];
                        });
                        setCommentInput("");
                      } else {
                        toast.error(res.error || "Failed to submit review.", "Error");
                      }
                    } catch {
                      toast.error("Failed to submit review. Please try again.", "Error");
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                    Write a Review
                  </h3>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Rating:</span>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "24px",
                            color: star <= ratingInput ? "var(--color-accent)" : "var(--color-border)",
                            padding: 0,
                            lineHeight: 1,
                            transition: "color 0.15s ease",
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="review-comment" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Your Review:</label>
                    <textarea
                      id="review-comment"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      required
                      placeholder="Share your thoughts about this product's fit, quality, or style..."
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "14px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-body)",
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submittingReview}
                    loading={submittingReview}
                    className="btn-premium"
                    style={{ width: "100%", minHeight: "40px", fontSize: "12px", borderRadius: "50px" }}
                  >
                    Submit Review
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Individual Reviews list (Right) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {loadingReviews ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                <span className="animate-spin text-secondary" style={{ fontSize: "24px" }}>⌛</span>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontStyle: "italic", color: "var(--color-accent)", margin: "0 0 8px" }}>
                  No reviews yet
                </p>
                <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>
                  Be the first to review this product!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: "20px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {review.user.name || "Verified Buyer"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "2px", fontSize: "14px" }}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const fill = i < review.rating;
                        return (
                          <span key={i} style={{ color: "var(--color-accent)" }}>
                            {fill ? "★" : "☆"}
                          </span>
                        );
                      })}
                    </div>

                    {review.comment && (
                      <p style={{ fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.6, margin: "4px 0 0" }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <style>{`
          @media (max-width: 768px) {
            .reviews-grid-responsive {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
            }
          }
        `}</style>
      </section>

      {/* Recently viewed */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 56px", padding: "0 24px" }}>
        <RecentlyViewed excludeProductId={product?.id || ""} />
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
          disabled={isOutOfStock || !selectedVariant}
          loading={isBuyingNow}
          onClick={handleBuyNow}
          className="btn-premium"
          style={{ flex: 1, minHeight: "48px", fontSize: "12px" }}
        >
          {isOutOfStock
            ? "Sold Out"
            : `Buy Now · ${formattedPrice}`}
        </Button>
      </div>
 
      {/* ── Size Guide Modal ── */}
      {isSizeGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "450px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 500, margin: 0 }}>
                Fit Guide
              </h2>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                ✕
              </button>
            </div>
 
            {/* Modal Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setSizeGuideTab("chart")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  borderBottom: sizeGuideTab === "chart" ? "2px solid var(--color-accent)" : "none",
                  fontWeight: sizeGuideTab === "chart" ? 600 : 400,
                  color: sizeGuideTab === "chart" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Size Chart
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab("advisor")}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  borderBottom: sizeGuideTab === "advisor" ? "2px solid var(--color-accent)" : "none",
                  fontWeight: sizeGuideTab === "advisor" ? 600 : 400,
                  color: sizeGuideTab === "advisor" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Find Your Size
              </button>
            </div>
 
            {/* Modal Content */}
            <div style={{ padding: "20px", maxHeight: "400px", overflowY: "auto" }}>
              {sizeGuideTab === "chart" ? (
                <div>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                        <th style={{ padding: "8px 4px", fontWeight: 600 }}>Size</th>
                        <th style={{ padding: "8px 4px", fontWeight: 600 }}>Chest (in)</th>
                        <th style={{ padding: "8px 4px", fontWeight: 600 }}>Length (in)</th>
                        <th style={{ padding: "8px 4px", fontWeight: 600 }}>Shoulder (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 4px", fontWeight: 500 }}>S</td>
                        <td style={{ padding: "8px 4px" }}>38&quot;</td>
                        <td style={{ padding: "8px 4px" }}>27&quot;</td>
                        <td style={{ padding: "8px 4px" }}>17.5&quot;</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 4px", fontWeight: 500 }}>M</td>
                        <td style={{ padding: "8px 4px" }}>40&quot;</td>
                        <td style={{ padding: "8px 4px" }}>28&quot;</td>
                        <td style={{ padding: "8px 4px" }}>18.0&quot;</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 4px", fontWeight: 500 }}>L</td>
                        <td style={{ padding: "8px 4px" }}>42&quot;</td>
                        <td style={{ padding: "8px 4px" }}>29&quot;</td>
                        <td style={{ padding: "8px 4px" }}>19.0&quot;</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 4px", fontWeight: 500 }}>XL</td>
                        <td style={{ padding: "8px 4px" }}>44&quot;</td>
                        <td style={{ padding: "8px 4px" }}>30&quot;</td>
                        <td style={{ padding: "8px 4px" }}>20.0&quot;</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 4px", fontWeight: 500 }}>XXL</td>
                        <td style={{ padding: "8px 4px" }}>46&quot;</td>
                        <td style={{ padding: "8px 4px" }}>31&quot;</td>
                        <td style={{ padding: "8px 4px" }}>21.0&quot;</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "16px", lineHeight: 1.5 }}>
                    * Measurements are design specifications and may vary slightly (±0.5 inches) depending on fabric fabrications.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Height Slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                      <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Height</span>
                      <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{userHeight} cm</span>
                    </div>
                    <input
                      type="range"
                      min="140"
                      max="210"
                      value={userHeight}
                      onChange={(e) => setUserHeight(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--color-accent)" }}
                    />
                  </div>
 
                  {/* Weight Slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                      <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Weight</span>
                      <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{userWeight} kg</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="130"
                      value={userWeight}
                      onChange={(e) => setUserWeight(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--color-accent)" }}
                    />
                  </div>
 
                  {/* Result Box */}
                  <div
                    style={{
                      background: "rgba(107,30,46,0.03)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      textAlign: "center",
                      marginTop: "10px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Recommended Size
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-heading)" }}>
                      {recommendedSize}
                    </div>
                  </div>
 
                  {/* Select button */}
                  <button
                    type="button"
                    onClick={handleSelectRecommendedSize}
                    className="btn btn-primary btn-premium"
                    style={{ width: "100%", padding: "12px", fontSize: "13px", marginTop: "10px" }}
                  >
                    Select Size {recommendedSize} & Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}