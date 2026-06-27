"use client";

import React, { useState, useEffect } from "react";

export function InitialLoader() {
  const [showLoader, setShowLoader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if we already showed the loader in this session
    const hasLoaded = sessionStorage.getItem("gvswift_loaded");
    if (!hasLoaded) {
      setShowLoader(true);
      sessionStorage.setItem("gvswift_loaded", "true");
      
      // Start fade out after 1.2s
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 1200);

      // Remove from DOM after fade out completes (300ms transition)
      const removeTimer = setTimeout(() => {
        setShowLoader(false);
      }, 1500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!showLoader) return null;

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
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.3s ease-in-out",
        pointerEvents: fadeOut ? "none" : "auto",
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
