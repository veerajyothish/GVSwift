import React from "react";

/**
 * PDF p.15: Full-screen cream loading screen.
 * Centered GVSWIFT wordmark (Garamond italic, wine red), thin horizontal rule,
 * "Crafting your experience..." italic caption below.
 */
export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        gap: "16px",
      }}
    >
      {/* Wordmark — PDF p.15 */}
      <span
        style={{
          fontFamily: "var(--font-heading), 'EB Garamond', Georgia, serif",
          fontSize: "clamp(28px, 6vw, 44px)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "var(--color-accent)",
          letterSpacing: "0.08em",
        }}
      >
        GVSWIFT
      </span>

      {/* Thin animated rule */}
      <div
        style={{
          width: "120px",
          height: "1px",
          background: `linear-gradient(90deg, transparent, var(--color-accent), transparent)`,
          animation: "loading-rule 1.6s ease-in-out infinite",
        }}
      />

      {/* Caption */}
      <span
        style={{
          fontFamily: "var(--font-heading), 'EB Garamond', Georgia, serif",
          fontSize: "15px",
          fontStyle: "italic",
          color: "var(--color-text-secondary)",
          letterSpacing: "0.02em",
        }}
      >
        Crafting your experience...
      </span>

      <style>{`
        @keyframes loading-rule {
          0%, 100% { opacity: 0.3; transform: scaleX(0.6); }
          50%       { opacity: 1;   transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}