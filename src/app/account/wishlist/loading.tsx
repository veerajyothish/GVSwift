/**
 * /account/wishlist loading.tsx — Wishlist skeleton
 * Matches: heading + subtitle, then 4-col product grid.
 */
import React from "react";

function ProductCardSkeleton() {
  return (
    <div className="sk-product-card">
      <div className="sk sk-img-3-4" style={{ borderRadius: "0" }} />
      <div className="sk-product-card-body">
        <span className="sk sk-h12 sk-w40" />
        <span className="sk sk-h16 sk-w100" />
        <span className="sk sk-h16 sk-w60" />
        <span className="sk sk-h20 sk-w30" style={{ marginTop: "4px" }} />
      </div>
    </div>
  );
}

export default function WishlistLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <header style={{ paddingBottom: "20px", borderBottom: "1px solid var(--color-border)" }}>
        <span className="sk sk-h36" style={{ width: "180px", marginBottom: "8px" }} />
        <span className="sk sk-h16 sk-w30" />
      </header>

      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}