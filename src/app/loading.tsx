/**
 * /admin loading.tsx — Admin dashboard skeleton
 * Matches PDF p.16: "Overview" heading, 4 KPI cards, chart + right-col, table section.
 */
import React from "react";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard..." style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: "24px",
          borderBottom: "1px solid var(--color-border)",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span className="sk sk-h44" style={{ width: "220px" }} />
          <span className="sk sk-h16 sk-w50" />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <span className="sk sk-pill sk-h36" style={{ width: "140px" }} />
          <span className="sk sk-pill sk-h36" style={{ width: "100px" }} />
        </div>
      </div>

      {/* 4 KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="sk sk-h12" style={{ width: "100px" }} />
              <span className="sk" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span className="sk sk-h32" style={{ width: "120px" }} />
              <span className="sk sk-h12 sk-w50" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + right col */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          alignItems: "start",
        }}
        className="admin-chart-grid"
      >
        {/* Chart card */}
        <div
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span className="sk sk-h24" style={{ width: "180px" }} />
          </div>
          <div style={{ padding: "20px 24px" }}>
            <span className="sk" style={{ width: "100%", height: "220px", borderRadius: "var(--radius-md)" }} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Inventory health */}
          <span className="sk" style={{ width: "100%", height: "100px", borderRadius: "var(--radius-lg)" }} />
          {/* Quick actions */}
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <span className="sk sk-h20" style={{ width: "120px" }} />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span className="sk sk-circle" style={{ width: "36px", height: "36px", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span className="sk sk-h16 sk-w60" />
                  <span className="sk sk-h12 sk-w80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders section */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <span className="sk sk-h24" style={{ width: "200px" }} />
          <span className="sk sk-h16" style={{ width: "80px" }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span className="sk" style={{ width: "22px", height: "22px" }} />
                <span className="sk sk-h20 sk-w50" />
              </div>
              <span className="sk sk-h14 sk-w100" />
              <span className="sk sk-h14 sk-w70" />
              <span className="sk sk-h16 sk-w40" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-chart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}