import React from "react";

export default function CheckoutLoading() {
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
        <div className="sk sk-h36 sk-w30" style={{ marginBottom: "12px", borderRadius: "4px" }} />
        <div className="sk sk-h16 sk-w50" style={{ borderRadius: "4px" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "32px",
        }}
        className="checkout-grid-skeleton"
      >
        {/* Style block for responsive grid */}
        <style>{`
          @media (min-width: 768px) {
            .checkout-grid-skeleton {
              grid-template-columns: 1.4fr 1fr !important;
            }
          }
        `}</style>

        {/* Left Column: Form skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card 1: Shipping Address */}
          <div
            style={{
              padding: "24px",
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div className="sk sk-h24 sk-w40" style={{ borderRadius: "4px" }} />
            <div style={{ height: "1px", backgroundColor: "var(--color-border)" }} />
            <div className="sk sk-h44 sk-w100" style={{ borderRadius: "var(--radius-md)" }} />
            <div className="sk sk-h44 sk-w100" style={{ borderRadius: "var(--radius-md)" }} />
            <div style={{ display: "flex", gap: "16px" }}>
              <div className="sk sk-h44 sk-w50" style={{ borderRadius: "var(--radius-md)" }} />
              <div className="sk sk-h44 sk-w50" style={{ borderRadius: "var(--radius-md)" }} />
            </div>
          </div>

          {/* Card 2: Payment Mode */}
          <div
            style={{
              padding: "24px",
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div className="sk sk-h24 sk-w30" style={{ borderRadius: "4px" }} />
            <div style={{ height: "1px", backgroundColor: "var(--color-border)" }} />
            <div className="sk sk-h48 sk-w100" style={{ borderRadius: "var(--radius-md)" }} />
          </div>
        </div>

        {/* Right Column: Order Summary skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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

            {/* Item 1 */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div className="sk" style={{ width: "50px", height: "64px", borderRadius: "var(--radius-md)" }} />
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="sk sk-h14 sk-w60" style={{ borderRadius: "4px" }} />
                <div className="sk sk-h12 sk-w30" style={{ borderRadius: "4px" }} />
              </div>
              <div className="sk sk-h14 sk-w20" style={{ borderRadius: "4px" }} />
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
