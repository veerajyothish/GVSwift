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
          minHeight: "calc(100vh - 64px)",
          padding: "40px 24px",
          textAlign: "center",
          background: "var(--color-bg)",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            padding: "56px 40px",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Wine-red 404 numeral */}
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "80px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-accent)",
              lineHeight: 1,
              margin: 0,
            }}
          >
            404
          </h1>

          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Page Not Found
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              lineHeight: 1.65,
              maxWidth: "320px",
              margin: 0,
            }}
          >
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            may have been moved, deleted, or never existed.
          </p>

          {/* Thin divider */}
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "var(--color-border)",
              margin: "8px 0",
            }}
          />

          <div style={{ display: "flex", gap: "10px", width: "100%", flexWrap: "wrap" }}>
            <Link
              href="/"
              className="btn btn-primary btn-premium"
              style={{ flex: 1, justifyContent: "center", minWidth: "120px" }}
            >
              Go Home
            </Link>
            <Link
              href="/products"
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: "center", minWidth: "120px" }}
            >
              Shop Catalog
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}