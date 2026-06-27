"use client";

/**
 * ProductCard — optimised for speed:
 * - Correct `sizes` attribute so Next.js serves 300px images not 1920px
 * - `loading="lazy"` on images below fold
 * - Transitions use `will-change: transform` only on hover (not always)
 * - Removed redundant state re-renders
 */

import React, { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface ProductImage {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}
interface ProductVariant {
  id: string;
  sku: string;
  stock: number;
  priceDeltaPaise: number;
}
interface Product {
  id: string;
  name: string;
  slug: string;
  basePricePaise: number;
  avgRating?: number | null;
  categoryId?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}
interface ProductCardProps {
  product: Product;
  initialWishlisted?: boolean;
  categoryName?: string;
  /** Pass true for first ~4 cards visible on load (above fold) */
  priority?: boolean;
}

export default function ProductCard({
  product,
  initialWishlisted = false,
  categoryName,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { wishlistedIds, refresh, toggleWishlist } = useWishlist();

  const isCurrentlyWishlisted =
    wishlistedIds.includes(product.id) || initialWishlisted;
  const [wishlisted, setWishlisted] = useState(isCurrentlyWishlisted);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [hovered, setHovered] = useState(false);

  const totalStock =
    product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const isOutOfStock = totalStock === 0;
  const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;

  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";

  const handleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => !prev);
    try {
      await toggleWishlist(product.id);
      await refresh();
    } catch {
      setWishlisted(isCurrentlyWishlisted);
    }
  }, [product.id, toggleWishlist, refresh, isCurrentlyWishlisted]);

  const getFirstInStockVariant = useCallback(() =>
    product.variants?.find((v) => v.stock > 0) || product.variants?.[0],
  [product.variants]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const variant = getFirstInStockVariant();
    if (!variant) return;
    setIsAddingToCart(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: variant.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      toast.success(`Added to cart!`, "Added to Cart");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not add item", "Error");
    } finally { setIsAddingToCart(false); }
  }, [product.id, isOutOfStock, getFirstInStockVariant, toast]);

  const handleBuyNow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const variant = getFirstInStockVariant();
    if (!variant) return;
    setIsBuyingNow(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: variant.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      router.push("/checkout");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not process Buy Now", "Error");
      setIsBuyingNow(false);
    }
  }, [product.id, isOutOfStock, getFirstInStockVariant, router, toast]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        // Only apply will-change on hover to avoid GPU memory waste
        willChange: hovered ? "transform" : "auto",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 16px 36px -12px rgba(107,30,46,0.14)"
          : "none",
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease",
        borderColor: hovered ? "rgba(107,30,46,0.18)" : "var(--color-border)",
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          overflow: "hidden",
          background: "var(--color-surface)",
        }}
      >
        <Link
          href={`/products/${product.slug}`}
          style={{ display: "block", width: "100%", height: "100%" }}
          prefetch={false} // prefetch on hover via Next.js default, not on render
        >
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            // Correct sizes — card is 25vw on desktop, 50vw on mobile
            // This prevents loading 1920px images for 300px cards
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{
              objectFit: "cover",
              transition: "transform 0.4s ease",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}
          />
        </Link>

        {/* Heart icon */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(253,250,245,0.9)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <Heart
            size={15}
            style={{
              fill: wishlisted ? "var(--color-accent)" : "none",
              stroke: wishlisted ? "var(--color-accent)" : "var(--color-text-secondary)",
              strokeWidth: 2,
            }}
          />
        </button>

        {isOutOfStock ? (
          <span className="product-card-badge-error">Out of Stock</span>
        ) : totalStock <= 5 ? (
          <span className="product-card-badge-warning">Only {totalStock} left</span>
        ) : null}
      </div>

      {/* Content */}
      <div
        style={{
          padding: "14px 14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flexGrow: 1,
        }}
      >
        {categoryName && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
              display: "block",
            }}
          >
            {categoryName}
          </span>
        )}

        <h3 style={{ margin: 0 }}>
          <Link
            href={`/products/${product.slug}`}
            prefetch={false}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              textDecoration: "none",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {product.name}
          </Link>
        </h3>

        <span
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            fontVariantNumeric: "tabular-nums",
            marginTop: "4px",
          }}
        >
          {formattedPrice}
        </span>

        {!isOutOfStock && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
            <Button
              variant="primary"
              style={{ width: "100%", minHeight: "36px", fontSize: "12px", borderRadius: "9999px" }}
              loading={isBuyingNow}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <Button
              variant="secondary"
              style={{ width: "100%", minHeight: "36px", fontSize: "12px", borderRadius: "9999px" }}
              loading={isAddingToCart}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        )}
        {isOutOfStock && (
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            Sold Out
          </span>
        )}
      </div>
    </div>
  );
}
