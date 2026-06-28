/**
 * /account loading.tsx — Account page skeleton
 * Matches: two-col layout (sidebar 220px + main), wine-red heading, card sections.
 */
import React from "react";

export default function AccountLoading() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* "My Account" heading area */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px 0",
        }}
      >
        <span className="sk sk-h44" style={{ width: "280px", marginBottom: "8px" }} />
        <span className="sk sk-h16 sk-w50" style={{ marginBottom: "40px" }} />
      </div>

      {/* Two-col grid */}
      <div className="account-container" style={{ paddingTop: 0 }}>
        {/* Sidebar skeleton */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            ["100%", "48px", true],
            ["80%", "36px", false],
            ["90%", "36px", false],
            ["70%", "36px", false],
            ["80%", "36px", false],
          ].map(([w, h, active], i) => (
            <span
              key={i}
              className="sk sk-pill"
              style={{
                width: String(w),
                height: String(h),
                background: active ? "rgba(107,30,46,0.12)" : undefined,
              }}
            />
          ))}
        </aside>

        {/* Main content skeleton */}
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Personal Information card */}
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="sk sk-h24" style={{ width: "200px" }} />
              <span className="sk sk-h32 sk-pill" style={{ width: "72px" }} />
            </div>
            {/* Card body */}
            <div style={{ padding: "28px 24px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {/* Avatar circle */}
              <span
                className="sk sk-circle"
                style={{ width: "64px", height: "64px", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span className="sk sk-h12 sk-w50" />
                    <span className="sk sk-h48 sk-w100 sk-pill" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span className="sk sk-h12 sk-w50" />
                    <span className="sk sk-h48 sk-w100 sk-pill" />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span className="sk sk-h12 sk-w40" />
                  <span className="sk sk-h48 sk-w100 sk-pill" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span className="sk sk-h12 sk-w40" />
                  <span className="sk sk-h48 sk-w100 sk-pill" />
                </div>
              </div>
            </div>
          </div>

          {/* Security card */}
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
              <span className="sk sk-h24" style={{ width: "120px", marginBottom: "6px" }} />
              <span className="sk sk-h14 sk-w60" />
            </div>
            <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span className="sk sk-h12 sk-w40" />
                  <span className="sk sk-h48 sk-w100 sk-pill" />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span className="sk sk-h48 sk-pill" style={{ width: "180px" }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}