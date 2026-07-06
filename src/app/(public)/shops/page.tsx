import React from "react";
import { getShops } from "@/features/catalog/service";
import ShopCard from "@/components/ui/ShopCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Shops — GVSwift",
  description: "Browse offline fashion stores online. Shop directly from curated local shops with unified checkout.",
};

export default async function ShopsPage() {
  const activeShops = await getShops({ isActive: true });

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px 80px 20px",
        minHeight: "60vh",
      }}
    >
      {/* Page Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            display: "inline-block",
            marginBottom: "8px",
          }}
        >
          Offline to Online Marketplace
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            margin: "0 0 16px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Discover Partner Shops
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--color-text-secondary)",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Explore authentic collections from handpicked local fashion houses, heritage craft shops, and independent designer labels.
        </p>
      </div>

      {/* Shops Grid */}
      {activeShops.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "var(--color-bg)",
            border: "1px dashed var(--color-border)",
            borderRadius: "16px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏪</div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
            No shops found
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "8px 0 0 0" }}>
            We&apos;re onboarding local shops. Check back soon!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "32px",
          }}
        >
          {activeShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}
