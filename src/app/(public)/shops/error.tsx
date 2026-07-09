"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export default function ShopsErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Shops Load Error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "80px 24px",
        textAlign: "center",
        backgroundColor: "var(--color-bg, #FDFAF5)",
        color: "var(--color-text-primary, #1A1A1A)",
        fontFamily: "var(--font-body, sans-serif)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-heading), 'EB Garamond', serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "var(--color-accent, #6B1E2E)",
          marginBottom: "16px",
        }}
      >
        Navigation Interrupted
      </h1>
      <p
        style={{
          fontSize: "15px",
          color: "var(--color-text-secondary, #70645D)",
          marginBottom: "32px",
          maxWidth: "480px",
          lineHeight: 1.6,
        }}
      >
        Could not load shops. Please try again.
      </p>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ padding: "12px 28px", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}
        >
          Try Again
        </button>
        <Link
          href="/"
          className="btn btn-secondary"
          style={{ padding: "12px 28px", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
