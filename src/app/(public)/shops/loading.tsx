import React from "react";

function ShopCardSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg, 12px)",
        overflow: "hidden",
      }}
    >
      {/* 16:9 Aspect Ratio cover image skeleton */}
      <div
        className="sk"
        style={{
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: 0,
        }}
      />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span className="sk sk-h20" style={{ width: "60%" }} />
        <span className="sk sk-h16" style={{ width: "40%" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
          <span className="sk sk-h12 sk-w100" />
          <span className="sk sk-h12 sk-w100" />
          <span className="sk sk-h12 sk-w60" />
        </div>
        <span className="sk sk-h36 sk-pill" style={{ width: "120px", marginTop: "12px" }} />
      </div>
    </div>
  );
}

export default function ShopsLoading() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px 80px 20px",
        minHeight: "60vh",
      }}
    >
      {/* Page Header Skeleton */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          marginBottom: "48px",
        }}
      >
        <span className="sk sk-h12" style={{ width: "150px" }} />
        <span className="sk sk-h40" style={{ width: "400px", maxWidth: "80vw" }} />
        <span className="sk sk-h16" style={{ width: "600px", maxWidth: "90vw" }} />
      </div>

      {/* Grid skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "32px",
        }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <ShopCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
