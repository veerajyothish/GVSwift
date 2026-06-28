/**
 * /account/orders loading.tsx — Order list skeleton
 * Matches: heading + subtitle, then order cards stacked.
 * Each card: top meta row (order# + date + amount + status badge), product thumb + name + Track btn.
 */
import React from "react";

function OrderCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Top meta row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
          {["100px", "120px", "90px"].map((w, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="sk sk-h12" style={{ width: "60px" }} />
              <span className="sk sk-h16" style={{ width: w }} />
            </div>
          ))}
        </div>
        {/* Status pill */}
        <span className="sk sk-pill sk-h28" style={{ width: "90px" }} />
      </div>

      {/* Product row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            className="sk"
            style={{ width: "64px", height: "64px", borderRadius: "var(--radius-md)", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span className="sk sk-h16" style={{ width: "180px" }} />
            <span className="sk sk-h12" style={{ width: "60px" }} />
          </div>
        </div>
        <span className="sk sk-pill sk-h44" style={{ width: "140px" }} />
      </div>
    </div>
  );
}

export default function OrdersLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header
        style={{ paddingBottom: "20px", borderBottom: "1px solid var(--color-border)" }}
      >
        <span className="sk sk-h36" style={{ width: "220px", marginBottom: "8px" }} />
        <span className="sk sk-h16 sk-w40" />
      </header>

      {/* Order cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}