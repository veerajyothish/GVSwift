"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export default function ProductsErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Products Load Error:", error);
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
        Could not load products. Please try again.
      </p>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 28px",
            backgroundColor: "var(--color-accent, #6B1E2E)",
            color: "#FDFAF5",
            border: "1px solid var(--color-accent, #6B1E2E)",
            borderRadius: "var(--radius-pill, 9999px)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-accent-dark, #561922)";
            e.currentTarget.style.borderColor = "var(--color-accent-dark, #561922)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-accent, #6B1E2E)";
            e.currentTarget.style.borderColor = "var(--color-accent, #6B1E2E)";
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: "12px 28px",
            backgroundColor: "transparent",
            color: "var(--color-accent, #6B1E2E)",
            border: "1px solid var(--color-accent, #6B1E2E)",
            borderRadius: "var(--radius-pill, 9999px)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-accent, #6B1E2E)";
            e.currentTarget.style.color = "#FDFAF5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--color-accent, #6B1E2E)";
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
