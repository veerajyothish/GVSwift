"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Shop {
  id: string;
  name: string;
  slug: string;
  brandImage: string;
  description: string;
  tagline: string | null;
}

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/shops/${shop.slug}`)}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg, 12px)",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        willChange: hovered ? "transform" : "auto",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 16px 36px -12px rgba(107,30,46,0.14)"
          : "none",
        transition: "transform 250ms cubic-bezier(0.16,1,0.3,1), box-shadow 250ms cubic-bezier(0.16,1,0.3,1), border-color 250ms cubic-bezier(0.16,1,0.3,1)",
        borderColor: hovered ? "var(--color-accent)" : "var(--color-border)",
      }}
    >
      {/* Brand Image Cover */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
          backgroundColor: "var(--color-surface-container-low, #eee)",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shop.brandImage}
          alt={`${shop.name} cover`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        {/* Brand overlay badge */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(4px)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          Local Partner
        </div>
      </div>

      {/* Info Content */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {shop.name}
          </h3>
          
          {shop.tagline && (
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-accent)",
                margin: "4px 0 0 0",
              }}
            >
              {shop.tagline}
            </p>
          )}

          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              margin: "8px 0 0 0",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {shop.description}
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-accent)",
            marginTop: "8px",
            alignSelf: "flex-start",
          }}
        >
          Visit Shop
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: hovered ? "translateX(4px)" : "translateX(0)",
              transition: "transform 150ms ease",
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
