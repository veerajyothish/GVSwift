import React from "react";

function ProductCardSkeleton() {
  return (
    <div className="sk-product-card">
      <div className="sk sk-img-3-4" style={{ borderRadius: 0 }} />
      <div className="sk-product-card-body">
        <span className="sk sk-h12 sk-w40" />
        <span className="sk sk-h16 sk-w100" />
        <span className="sk sk-h16 sk-w60" />
        <span className="sk sk-h20 sk-w30" style={{ marginTop: "4px" }} />
      </div>
    </div>
  );
}

export default function ShopDetailsLoading() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Hero Banner Header Skeleton */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "56px 24px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          backgroundColor: "var(--color-surface-container-low, #f6f3f2)",
        }}
      >
        <span className="sk sk-h32 sk-pill" style={{ width: "160px" }} />
        {/* Avatar logo skeleton */}
        <div
          className="sk"
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
          }}
        />
        <span className="sk sk-h40" style={{ width: "320px", maxWidth: "80vw" }} />
        <span className="sk sk-h16" style={{ width: "200px", maxWidth: "50vw" }} />
        <span className="sk sk-h16" style={{ width: "500px", maxWidth: "90vw" }} />
      </div>

      {/* Main Content Skeleton */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px 24px" }}>
        {/* Scoped Category Pills Skeleton */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "36px",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "20px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="sk sk-h36 sk-pill" style={{ width: "140px" }} />
            <span className="sk sk-h36 sk-pill" style={{ width: "100px" }} />
            <span className="sk sk-h36 sk-pill" style={{ width: "120px" }} />
          </div>
          <span className="sk sk-h16" style={{ width: "100px" }} />
        </div>

        {/* Product Grid Skeleton */}
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
