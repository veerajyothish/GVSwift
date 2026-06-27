"use client";

/**
 * NavbarIconsAndSearch — PDF p.1/4/6:
 * Right-side icons: account (circle dashed outline on PDF p.1), shopping bag.
 * Both wine-red, clean SVG, badge dot on cart.
 */
import React from "react";
import Link from "next/link";

interface NavbarIconsAndSearchProps {
  isLoggedIn: boolean;
  cartCount: number;
  wishlistIcon: React.ReactNode;
}

export function NavbarIconsAndSearch({
  isLoggedIn,
  cartCount,
}: NavbarIconsAndSearchProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      {/* Account icon — PDF p.1: dashed circle on desktop when logged in */}
      <Link
        href={isLoggedIn ? "/account" : "/login"}
        aria-label={isLoggedIn ? "My account" : "Sign in"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: isLoggedIn
            ? "1.5px dashed var(--color-accent)"
            : "1px solid transparent",
          color: "var(--color-accent)",
          textDecoration: "none",
          transition: "background 0.15s",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>

      {/* Cart / shopping bag icon — PDF p.1/4 */}
      <Link
        href="/cart"
        aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          color: "var(--color-accent)",
          textDecoration: "none",
          position: "relative",
          transition: "background 0.15s",
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>

        {cartCount > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "var(--color-accent)",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}