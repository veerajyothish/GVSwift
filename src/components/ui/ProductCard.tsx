"use client";

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
}

export default function ProductCard({
  product,
  initialWishlisted = false,
  categoryName,
}: ProductCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { wishlistedIds, refresh, toggleWishlist } = useWishlist();
  
  // Resolve wishlisted status from context, with fallback to initialWishlisted
  const isCurrentlyWishlisted = wishlistedIds.includes(product.id) || initialWishlisted;
  const [wishlisted, setWishlisted] = useState(isCurrentlyWishlisted);

  // Sync state with context value if it changes
  React.useEffect(() => {
    setWishlisted(isCurrentlyWishlisted);
  }, [isCurrentlyWishlisted]);

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const totalStock = product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
  const isOutOfStock = totalStock === 0;
  const formattedPrice = `₹${(product.basePricePaise / 100).toLocaleString("en-IN")}`;

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || "/fashion_product_mockup.png";

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update pattern
    setWishlisted((prev) => !prev);
    try {
      await toggleWishlist(product.id);
      await refresh();
    } catch {
      // Revert on error
      setWishlisted(isCurrentlyWishlisted);
    }
  };

  const getFirstInStockVariant = () => {
    return product.variants?.find((v) => v.stock > 0) || product.variants?.[0];
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;
    const selectedVariant = getFirstInStockVariant();
    if (!selectedVariant) return;

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

      toast.success(`Added ${product.name} to cart!`, "Added to Cart");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not add item to cart";
      toast.error(message, "Error");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;
    const selectedVariant = getFirstInStockVariant();
    if (!selectedVariant) return;

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

      router.push("/checkout");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not process Buy Now request";
      toast.error(message, "Error");
      setIsBuyingNow(false);
    }
  };

  return (
    <div
      className="card card-interactive card-product"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: "none",
        background: "var(--color-surface)",
        boxShadow: "0 4px 12px rgba(86, 25, 34, 0.05)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease"
      }}
    >
      {/* Image Wrapper */}
      <div
        className="card-product-image-container"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3/4",
          overflow: "hidden",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <Link href={`/products/${product.slug}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
            className="card-product-image"
          />
        </Link>

        {/* Wishlist Toggle Overlay */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80
                     backdrop-blur-sm shadow-sm transition-transform duration-200
                     hover:scale-110 active:scale-95"
          style={{ border: "none", cursor: "pointer" }}
        >
          <Heart
            size={18}
            className={wishlisted ? "fill-red-500 stroke-red-500" : "fill-none stroke-gray-400"}
          />
        </button>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <span className="product-card-badge-error" style={{ position: "absolute", top: "12px", left: "12px" }}>
            Out of Stock
          </span>
        ) : totalStock <= 5 ? (
          <span className="product-card-badge-warning" style={{ position: "absolute", top: "12px", left: "12px" }}>
            Only {totalStock} left
          </span>
        ) : null}
      </div>

      {/* Content Section */}
      <div
        className="card-product-content"
        style={{
          padding: "16px",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          {categoryName && (
            <span
              className="card-product-category"
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-secondary)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {categoryName}
            </span>
          )}
          <h3
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              marginBottom: "6px",
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              height: "42px",
            }}
          >
            <Link href={`/products/${product.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
              {product.name}
            </Link>
          </h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              className="card-product-price"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formattedPrice}
            </span>
            {product.avgRating && (
              <div
                className="product-rating"
                style={{
                  fontFamily: "var(--font-body), sans-serif",
                  color: "var(--color-primary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {product.avgRating.toFixed(1)} ★
              </div>
            )}
          </div>
          {totalStock <= 10 && totalStock > 0 && (
            <p style={{ fontSize: '12px', color: '#a12c7b', fontWeight: 600, margin: '6px 0 0' }}>
              ⚡ Only {totalStock} left
            </p>
          )}
          {totalStock === 0 && (
            <p style={{ fontSize: '12px', color: '#7a7974', fontWeight: 600, margin: '6px 0 0' }}>
              Out of Stock
            </p>
          )}
        </div>

        {/* Action CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          <Button
            variant={isOutOfStock ? "secondary" : "primary"}
            style={{ width: "100%", paddingTop: "8px", paddingBottom: "8px", minHeight: "38px" }}
            disabled={isOutOfStock}
            loading={isBuyingNow}
            onClick={handleBuyNow}
          >
            {isOutOfStock ? "Sold Out" : "Buy Now"}
          </Button>
          <Button
            variant="secondary"
            style={{ width: "100%", paddingTop: "8px", paddingBottom: "8px", minHeight: "38px" }}
            disabled={isOutOfStock}
            loading={isAddingToCart}
            onClick={handleAddToCart}
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
