import React from "react";

export default function CartLoading() {
  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "48px 24px 80px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ marginBottom: "36px" }}>
        <div className="sk sk-h36 sk-w20" style={{ marginBottom: "12px", borderRadius: "4px" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "32px",
        }}
        className="cart-grid-skeleton"
      >
        {/* Style block for responsive grid */}
        <style>{`
          @media (min-width: 768px) {
            .cart-grid-skeleton {
              grid-template-columns: 2fr 1.2fr !important;
            }
          }
        `}</style>

        {/* Left Column: Cart Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: "16px",
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                gap: "16px",
              }}
            >
              <div className="sk" style={{ width: "80px", height: "80px", borderRadius: "var(--radius-md)" }} />
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="sk sk-h16 sk-w60" style={{ borderRadius: "4px" }} />
                <div className="sk sk-h12 sk-w30" style={{ borderRadius: "4px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <div className="sk sk-h28 sk-w100" style={{ width: "90px", borderRadius: "var(--radius-pill)" }} />
                  <div className="sk sk-h24" style={{ width: "24px", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Summary Box */}
        <div>
          <div
            style={{
              padding: "24px",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div className="sk sk-h24 sk-w40" style={{ borderRadius: "4px" }} />
            <div style={{ height: "1px", backgroundColor: "var(--color-border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="sk sk-h14 sk-w30" style={{ borderRadius: "4px" }} />
              <div className="sk sk-h14 sk-w20" style={{ borderRadius: "4px" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="sk sk-h14 sk-w30" style={{ borderRadius: "4px" }} />
              <div className="sk sk-h14 sk-w20" style={{ borderRadius: "4px" }} />
            </div>
            <div style={{ height: "1px", backgroundColor: "var(--color-border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="sk sk-h20 sk-w30" style={{ borderRadius: "4px" }} />
              <div className="sk sk-h20 sk-w25" style={{ borderRadius: "4px" }} />
            </div>
            <div className="sk sk-h48 sk-w100" style={{ marginTop: "12px", borderRadius: "var(--radius-pill)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
