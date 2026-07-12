"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { trackEvent } from "@/lib/analytics/ga4";
import { mapProductToGa4Item } from "@/lib/analytics/ecommerce";

interface ProductImage {
  id?: string;
  url: string;
  altText?: string | null;
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
  brand?: string | null;
  basePricePaise: number;
  avgRating?: number | null;
  reviewCount?: number;
  description?: string | null;
  categoryId?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  priority?: boolean;
  initialWishlisted?: boolean; // Keep for backward-compatibility with callers
  listName?: string;
  index?: number;
}

export default function ProductCard({
  product,
  categoryName,
  priority = false,
  listName,
  index,
}: ProductCardProps) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    router.prefetch(`/products/${product.slug}`);
  }, [router, product.slug]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const handleProductClick = useCallback(() => {
    const computedListName = listName || categoryName || "Products";
    trackEvent("select_item", {
      item_list_name: computedListName,
      items: [
        mapProductToGa4Item(product, {
          index,
          item_list_name: computedListName,
        }),
      ],
    });
  }, [product, listName, categoryName, index]);

  const totalStock =
    product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const isOutOfStock = totalStock === 0;
  const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;

  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";
  const [imgError, setImgError] = useState(false);

  // ponytail: inline SVG brand-initials fallback
  const initials = (product.brand || product.name)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  const svgFallback = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%236b1e2e"/><stop offset="100%" stop-color="%238b3a4a"/></linearGradient></defs><rect width="300" height="400" fill="%23f3f0ec"/><circle cx="150" cy="180" r="60" fill="url(%23g)"/><text x="150" y="196" text-anchor="middle" font-size="36" font-weight="700" fill="%23fff" font-family="serif">${initials}</text></svg>`
  )}`;

  const handleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(product.id);
    } catch {
      // Revert is handled inside context
    }
  }, [product.id, toggleWishlist]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        willChange: hovered ? "transform" : "auto",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "var(--shadow-md)"
          : "var(--shadow-sm)",
        transition: "transform 150ms cubic-bezier(0.16,1,0.3,1), box-shadow 150ms cubic-bezier(0.16,1,0.3,1), border-color 150ms cubic-bezier(0.16,1,0.3,1)",
        borderColor: hovered ? "rgba(107,30,46,0.18)" : "var(--color-border)",
      }}
    >
      <Link
        href={`/products/${product.slug}`}
        prefetch={true}
        onClick={handleProductClick}
        style={{ display: "flex", flexDirection: "column", flexGrow: 1, textDecoration: "none", color: "inherit" }}
      >
        {/* Image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "240px",
            overflow: "hidden",
            background: "var(--color-surface)",
          }}
        >
          <Image
            src={imgError ? svgFallback : imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={svgFallback}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
            style={{
              objectFit: "cover",
              transition: "transform 0.4s ease",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: hovered ? "translate(-50%, 0)" : "translate(-50%, 8px)",
              opacity: hovered ? 1 : 0,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(4px)",
              padding: "8px 20px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              boxShadow: "var(--shadow-sm)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 3,
            }}
          >
            View Details
          </div>

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
          {/* Brand name */}
          {product.brand && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {product.brand}
            </span>
          )}

          {/* Product name */}
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {product.name}
          </h3>

          {/* Short description */}
          {product.description ? (
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                margin: "2px 0 4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.4,
              }}
            >
              {product.description}
            </p>
          ) : (
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                margin: "2px 0 4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.4,
                opacity: 0,
              }}
            >
              &nbsp;
            </p>
          )}

          {/* Rating */}
          {product.avgRating !== undefined && product.avgRating !== null && product.avgRating > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", margin: "2px 0 6px" }}>
              <div style={{ display: "flex", gap: "1px" }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const fill = i < Math.round(product.avgRating ?? 0);
                  return (
                    <span key={i} style={{ color: "var(--color-accent)", fontSize: "12px" }}>
                      {fill ? "★" : "☆"}
                    </span>
                  );
                })}
              </div>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>
                ({product.reviewCount ?? 0})
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", margin: "2px 0 6px", opacity: 0 }}>
              <span>&nbsp;</span>
            </div>
          )}

          {/* Price */}
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
              marginTop: "auto",
            }}
          >
            {formattedPrice}
          </span>
        </div>
      </Link>

      {/* Heart icon OUTSIDE the Link so it doesn't break HTML structure, positioned absolute to the outer div */}
      <button
        onClick={handleWishlist}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
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
          zIndex: 10,
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
    </div>
  );
}
