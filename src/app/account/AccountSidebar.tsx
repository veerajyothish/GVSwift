"use client";

/**
 * AccountSidebar — Elegant minimalist sidebar
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/SignOutButton";

export default function AccountSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/account/profile",   label: "Profile" },
    { href: "/account/orders",    label: "Orders" },
    { href: "/account/addresses", label: "Address Book" },
    { href: "/account/wishlist",  label: "Wishlist" },
    { href: "/account/loyalty",   label: "Loyalty & Rewards" },
    { href: "/support",           label: "Support" },
    { href: "/account/settings",  label: "Settings" },
  ];

  return (
    <aside
      aria-label="Account navigation"
      style={{ width: "100%", marginBottom: "32px" }}
    >
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
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
                padding: "12px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
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