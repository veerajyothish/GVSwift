"use client";

/**
 * ProductCard — PDF p.6/7:
 * 3:4 aspect image (no bottom border), category label (small caps, muted), product name,
 * price below name. Heart icon top-right overlay on image. No in-card CTA buttons on catalog
 * (keep them for functionality but minimal style). Clean white card, hover lift.
 */

import React, { useState } from "react";
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

  React.useEffect(() => {
    setWishlisted(isCurrentlyWishlisted);
  }, [isCurrentlyWishlisted]);

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const totalStock =
    product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const isOutOfStock = totalStock === 0;
  const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;

  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => !prev);
    try {
      await toggleWishlist(product.id);
      await refresh();
    } catch {
      setWishlisted(isCurrentlyWishlisted);
    }
  };

  const getFirstInStockVariant = () =>
    product.variants?.find((v) => v.stock > 0) || product.variants?.[0];

  const handleAddToCart = async (e: React.MouseEvent) => {
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
      toast.success(`Added ${product.name} to cart!`, "Added to Cart");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not add item", "Error");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
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
  };

  return (
    /* PDF p.6: card = cream bg, no box-shadow, clean border, hover lift */
    <div
      className="hover-lift"
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
      }}
    >
      {/* ── Image ──────────────────────────────────────────────────────── */}
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
        >
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
          />
        </Link>

        {/* Heart icon — PDF: top-right on image */}
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
            background: "rgba(253,250,245,0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
            transition: "transform 0.2s",
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

        {/* Stock badge */}
        {isOutOfStock ? (
          <span className="product-card-badge-error">Out of Stock</span>
        ) : totalStock <= 5 ? (
          <span className="product-card-badge-warning">Only {totalStock} left</span>
        ) : null}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {/* PDF p.6: category small caps, name, price — no buttons on grid card */}
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

        {/* Price — PDF: below name, no accent colour on catalog, just dark */}
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

        {/* Add-to-cart / Buy Now — kept for functionality, minimal */}
        {!isOutOfStock && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "12px",
            }}
          >
            <Button
              variant="primary"
              style={{
                width: "100%",
                minHeight: "36px",
                fontSize: "12px",
                borderRadius: "9999px",
              }}
              loading={isBuyingNow}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <Button
              variant="secondary"
              style={{
                width: "100%",
                minHeight: "36px",
                fontSize: "12px",
                borderRadius: "9999px",
              }}
              loading={isAddingToCart}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        )}
        {isOutOfStock && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              marginTop: "8px",
            }}
          >
            Sold Out
          </span>
        )}
      </div>
    </div>
  );
}