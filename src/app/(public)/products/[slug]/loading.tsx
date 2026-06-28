/**
 * /products/[slug] loading.tsx — Product Detail skeleton
 * Matches PDF p.4/5: large 3:4 image left (sticky), info column right.
 * Mobile: full-width image, then text below.
 */
import React from "react";

export default function ProductDetailLoading() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <style>{`
        .pdp-sk-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          align-items: start;
        }
        @media (max-width: 767px) {
          .pdp-sk-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 24px 0" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="sk sk-h12" style={{ width: "80px" }} />
          <span className="sk sk-h12" style={{ width: "6px" }} />
          <span className="sk sk-h12" style={{ width: "90px" }} />
        </div>
      </div>

      <div className="pdp-sk-grid">
        {/* Left: 3:4 image */}
        <div style={{ position: "sticky", top: "80px" }}>
          <div
            className="sk sk-card"
            style={{ width: "100%", aspectRatio: "3 / 4", borderRadius: "var(--radius-lg)" }}
          />
        </div>

        {/* Right: info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "0 20px" }}>
          {/* Category breadcrumb */}
          <span className="sk sk-h12 sk-w40" />

          {/* Title — 2 lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span className="sk sk-h44 sk-w100" />
            <span className="sk sk-h44 sk-w60" />
          </div>

          {/* Price */}
          <span className="sk sk-h28 sk-w30" />

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

          {/* Size label + pills */}
          <div>
            <span className="sk sk-h12 sk-w20" style={{ marginBottom: "12px" }} />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {[52, 52, 52, 52].map((w, i) => (
                <span key={i} className="sk sk-pill" style={{ width: `${w}px`, height: "44px" }} />
              ))}
            </div>
          </div>

          {/* Stock indicator */}
          <span className="sk sk-h12 sk-w30 sk-pill" />

          {/* CTAs */}
          <span className="sk sk-h52 sk-w100 sk-pill" style={{ height: "52px" }} />
          <span className="sk sk-h44 sk-w100 sk-pill" style={{ height: "44px" }} />

          {/* Description box */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span className="sk sk-h20 sk-w30" />
            <span className="sk sk-h16 sk-w100" />
            <span className="sk sk-h16 sk-w90" style={{ width: "90%" }} />
            <span className="sk sk-h16 sk-w70" />
          </div>

          {/* Accordion rows */}
          {[1, 2].map((i) => (
            <div key={i} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              <span className="sk sk-h12 sk-w40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}