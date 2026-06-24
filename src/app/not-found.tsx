import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 120px)",
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text-primary)",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            padding: "40px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              lineHeight: "1",
              marginBottom: "24px",
              userSelect: "none",
            }}
          >
            🕵️‍♂️
          </span>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              marginBottom: "12px",
              fontFamily: "var(--font-heading)",
              color: "var(--color-accent)",
            }}
          >
            404
          </h1>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "var(--color-text-primary)",
            }}
          >
            Page Not Found
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              lineHeight: "1.6",
              marginBottom: "32px",
            }}
          >
            Sorry, we couldn&apos;t find the page you are looking for. It might have been moved, deleted, or never existed.
          </p>
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <Link
              href="/"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "44px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.2s ease",
              }}
            >
              Go Home
            </Link>
            <Link
              href="/products"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "44px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              Shop Catalog
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
