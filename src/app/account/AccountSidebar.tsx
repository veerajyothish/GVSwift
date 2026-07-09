"use client";

/**
 * AccountSidebar — PDF p.8/11/12:
 * Vertical nav: active item = wine-red filled pill, inactive = muted text uppercase.
 * PDF p.8 shows: PROFILE (active, filled), ORDERS, ADDRESSES, WISHLIST, SETTINGS
 * PDF p.11 shows: Profile, Orders, Address Book (active), Payment Methods — with icons
 * PDF p.12 shows: PROFILE DETAILS (active), ORDER HISTORY, ADDRESSES, WISHLIST, SIGN OUT
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/SignOutButton";

export default function AccountSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/account/profile",   label: "Profile",           icon: "👤" },
    { href: "/account/orders",    label: "Orders",            icon: "🛍" },
    { href: "/account/addresses", label: "Address Book",      icon: "📍" },
    { href: "/account/wishlist",  label: "Wishlist",          icon: "♡" },
    { href: "/account/loyalty",   label: "Loyalty & Rewards", icon: "⭐" },
    { href: "/support",           label: "Support",           icon: "💬" },
    { href: "/account/settings",  label: "Settings",          icon: "⚙️" },
  ];

  return (
    <aside
      aria-label="Account navigation"
      style={{ width: "100%" }}
    >
      {/* Mobile: pill tabs horizontal scroll */}
      <div
        className="account-mobile-tabs"
        style={{
          display: "none",
          overflowX: "auto",
          gap: "8px",
          paddingBottom: "16px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {links.slice(0, 3).map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                textDecoration: "none",
                background: isActive ? "var(--color-accent)" : "transparent",
                color: isActive ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                flexShrink: 0,
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop: vertical sidebar */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
        aria-label="Account sections"
      >
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: isActive ? "9999px" : "6px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
                background: isActive ? "var(--color-accent)" : "transparent",
                color: isActive
                  ? "var(--color-accent-text)"
                  : "var(--color-text-secondary)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "var(--color-border)",
            margin: "12px 0",
          }}
        />

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textDecoration: "none",
            color: "var(--color-text-secondary)",
          }}
        >
          ← Back to Store
        </Link>

        <SignOutButton
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: "none",
            border: "none",
            color: "var(--color-error)",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          Sign Out
        </SignOutButton>
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .account-mobile-tabs { display: flex !important; }
          aside nav { display: none; }
        }
      `}</style>
    </aside>
  );
}