import React from "react";

export default function OrdersLoading() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "48px 24px 80px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div style={{ marginBottom: "36px" }}>
        <div className="sk sk-h36 sk-w30" style={{ marginBottom: "12px", borderRadius: "4px" }} />
        <div className="sk sk-h16 sk-w50" style={{ borderRadius: "4px" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
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
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <div className="sk sk-h12 sk-w100" style={{ width: "80px", marginBottom: "6px", borderRadius: "4px" }} />
                  <div className="sk sk-h16 sk-w100" style={{ width: "120px", borderRadius: "4px" }} />
                </div>
                <div>
                  <div className="sk sk-h12 sk-w100" style={{ width: "80px", marginBottom: "6px", borderRadius: "4px" }} />
                  <div className="sk sk-h16 sk-w100" style={{ width: "100px", borderRadius: "4px" }} />
                </div>
              </div>
              <div className="sk sk-h28 sk-w100" style={{ width: "110px", borderRadius: "var(--radius-pill)" }} />
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--color-border)" }} />

            {/* Content row */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div className="sk" style={{ width: "60px", height: "80px", borderRadius: "var(--radius-md)" }} />
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="sk sk-h16 sk-w50" style={{ borderRadius: "4px" }} />
                <div className="sk sk-h12 sk-w20" style={{ borderRadius: "4px" }} />
              </div>
              <div className="sk sk-h16 sk-w15" style={{ borderRadius: "4px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
