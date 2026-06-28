/**
 * /products loading.tsx — Catalog skeleton
 * Matches exact page layout: cream header, pill filter row, 4-col product grid.
 * Uses .sk design system (bg:#F5F0EB shimmer:#E8DDD9 radius:8px 1.5s loop).
 */
import React from "react";

function ProductCardSkeleton() {
  return (
    <div className="sk-product-card">
      {/* 3:4 image */}
      <div className="sk sk-img-3-4 sk-card" style={{ borderRadius: "0" }} />
      <div className="sk-product-card-body">
        {/* Category label */}
        <span className="sk sk-h12 sk-w40" />
        {/* Product name — 2 lines */}
        <span className="sk sk-h16 sk-w100" />
        <span className="sk sk-h16 sk-w60" />
        {/* Price */}
        <span className="sk sk-h20 sk-w30" style={{ marginTop: "4px" }} />
        {/* Buttons */}
        <span className="sk sk-h36 sk-w100 sk-pill" style={{ marginTop: "8px" }} />
        <span className="sk sk-h36 sk-w100 sk-pill" />
      </div>
    </div>
  );
}

export default function CatalogLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
      }}
    >
      {/* ── Page header skeleton ── */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "56px 24px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span className="sk sk-h44" style={{ width: "340px", maxWidth: "80vw" }} />
        <span className="sk sk-h16" style={{ width: "480px", maxWidth: "90vw" }} />
        <span className="sk sk-h16" style={{ width: "360px", maxWidth: "80vw" }} />
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* ── Filter pills row skeleton ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {/* Category pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["80px", "100px", "90px", "110px", "95px"].map((w, i) => (
              <span
                key={i}
                className="sk sk-h36 sk-pill"
                style={{ width: w }}
              />
            ))}
          </div>
          {/* Sort pills */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["88px", "80px", "80px"].map((w, i) => (
              <span
                key={i}
                className="sk sk-h32 sk-pill"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>

        {/* Price filter row */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "36px" }}>
          {["40px", "100px", "120px", "120px"].map((w, i) => (
            <span key={i} className="sk sk-h28 sk-pill" style={{ width: w }} />
          ))}
        </div>

        {/* ── Product grid: 4-col desktop, 2-col mobile ── */}
        <div className="product-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "64px",
            paddingTop: "28px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="sk sk-h36" style={{ width: "40px", borderRadius: "6px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}