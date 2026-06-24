"use client";

import React from "react";
import { useWishlist } from "@/context/WishlistContext";

interface WishlistToggleProps {
  productId: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function WishlistToggle({
  productId,
  size = 20,
  className = "",
  style = {},
}: WishlistToggleProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(productId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <button
      onClick={handleToggle}
      className={`wishlist-toggle-btn ${className}`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        border: "none",
        borderRadius: "50%",
        width: `${size + 14}px`,
        height: `${size + 14}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: wishlisted ? "var(--color-primary)" : "var(--color-text-secondary)",
        boxShadow: "0 2px 8px rgba(86, 25, 34, 0.1)",
        transition: "transform 0.2s, color 0.2s",
        ...style,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        if (!wishlisted) {
          e.currentTarget.style.color = "var(--color-primary)";
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        if (!wishlisted) {
          e.currentTarget.style.color = "var(--color-text-secondary)";
        }
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
